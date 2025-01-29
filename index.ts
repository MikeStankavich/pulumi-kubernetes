// portions Copyright 2016-2018, Pulumi Corporation.  All rights reserved.

import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import {kubeconfig} from "./k8s-cluster";
import * as k8sService from "./k8s-service";
import * as digitalocean from "@pulumi/digitalocean";


const config = new pulumi.Config();
const domainName = config.get("domainName");

const provider = new k8s.Provider("do-k8s", {kubeconfig});

const redisLeader = new k8sService.ServiceDeployment("redis-leader", {
    image: "redis",
    ports: [6379],
  },
  {provider: provider});

const redisReplica = new k8sService.ServiceDeployment("redis-replica", {
    image: "pulumi/guestbook-redis-replica",
    ports: [6379],
  },
  {provider: provider});

const frontend = new k8sService.ServiceDeployment("frontend", {
    replicas: 3,
    image: "pulumi/guestbook-php-redis",
    ports: [80],
    allocateIpAddress: true,
    dnsName: "@"
  },
  {provider: provider});

// outputs for guestbook frontend
export const guestbookIp = frontend.ipAddress;
export const guestbookUrl = pulumi.interpolate `http://${domainName}`;


// ----------------------------------------------------------------------------
// todo: break out the prometheus stack into its own component file
// ----------------------------------------------------------------------------
const prometheusNamespace = config.get("prometheusNamespace") || "prometheus";
const appLabels = {
  app: "prometheus",
};

// Create a namespace (user supplies the name of the namespace)
const prometheusNs = new k8s.core.v1.Namespace(prometheusNamespace, {
  metadata: {
    labels: appLabels,
    name: prometheusNamespace,
  },
}, {
  provider: provider,
});

// Use Helm to install the Nginx prometheus controller
// todo: figure out why recreate timed out when I changed this resource name
const prometheusStack = new k8s.helm.v3.Release("prometheusstack", {
  chart: "kube-prometheus-stack",
  namespace: prometheusNamespace,
  repositoryOpts: {
    repo: "https://prometheus-community.github.io/helm-charts",
  },
  // skipCrds: true,
  values: {
    grafana: {
      // adminPassword: "admin",
      service: {
        type: "LoadBalancer"
      },
    }
  },
  version: "68.3.3",
}, {
  provider: provider,
  dependsOn: prometheusNs,
  customTimeouts: { create: "10m" },
});

// Get the Grafana service so that we can extract its IP address
const grafanaService: k8s.core.v1.Service = k8s.core.v1.Service.get(
  "grafana-service",
  pulumi.interpolate `${prometheusNs.metadata.name}/${prometheusStack.status.name}-grafana`
)
export const grafanaIngressIp = grafanaService.status.loadBalancer.ingress[0].ip

// Get the Grafana secret created by the helm chart so that we can extract the default admin creds
const grafanaSecret: k8s.core.v1.Secret = k8s.core.v1.Secret.get(
  "grafana-secret",
  pulumi.interpolate `${prometheusNs.metadata.name}/${prometheusStack.status.name}-grafana`
)

export const grafanaAdminUser = grafanaSecret.data["admin-user"].apply((value) => {
  const buffer = Buffer.from(value, "base64");
  return buffer.toString("utf-8");
});

export const grafanaAdminPass = grafanaSecret.data["admin-password"].apply((value) => {
  const buffer = Buffer.from(value, "base64");
  return buffer.toString("utf-8");
});


if (domainName) {
  const aRecord = new digitalocean.DnsRecord("do-grafana-a-rec", {
    domain: domainName || "example.com",    // Typescript hates optional string so supply a default
    type: "A",
    name: "grafana",
    value: grafanaIngressIp || "127.0.0.1"    // Typescript hates optional string so supply a default
  });
}

export const grafanaUrl = pulumi.interpolate `http://grafana.${domainName}`;
// export const grafanaPassword = pulumi.interpolate `http://grafana.${domainName}`;

