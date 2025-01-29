// portions Copyright 2016-2018, Pulumi Corporation.  All rights reserved.

import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import {kubeconfig} from "./k8s-cluster";
import * as k8sService from "./k8s-service";

const provider = new k8s.Provider("do-k8s", { kubeconfig });

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

export let guestbookIp = frontend.ipAddress;



//Get Helm Repository Info
// helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
// helm repo update
// See helm repo for command documentation.
//
// Install Helm Chart
// helm install [RELEASE_NAME] prometheus-community/kube-prometheus-stack


const config = new pulumi.Config();
const k8sNamespace = config.get("k8sNamespace") || "prometheus";
const appLabels = {
  app: "prometheus",
};

// Create a namespace (user supplies the name of the namespace)
const prometheusNs = new k8s.core.v1.Namespace("prometheus", {
  metadata: {
    labels: appLabels,
    name: k8sNamespace,
  },
}, {
  provider: provider,
});

// Use Helm to install the Nginx prometheus controller
const prometheusStack = new k8s.helm.v3.Release("prometheusstack", {
  chart: "kube-prometheus-stack",
  namespace: prometheusNs.metadata.name,
  repositoryOpts: {
    repo: "https://prometheus-community.github.io/helm-charts",
  },
  // skipCrds: true,
  values: {
    // prometheus specific values
  },
  version: "68.3.3",
}, {
  provider: provider,
  dependsOn: prometheusNs,
});

// Export some values for use elsewhere
export const name = prometheusStack.name;