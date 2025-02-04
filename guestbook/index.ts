// portions Copyright 2016-2018, Pulumi Corporation.  All rights reserved.

import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as k8sService from "./k8s-service";
import * as digitalocean from "@pulumi/digitalocean";


const config = new pulumi.Config();
const domainName = config.get("domainName");

const provider = new k8s.Provider("do-k8s", { kubeconfig: process.env.KUBECONFIG });

// optionally set up a DigitalOcean DNS zone
if (domainName) {
  const domain = new digitalocean.Domain("do-domain", {
    name: domainName,
    // ipAddress: ingressIp,
  });

  const cnameRecord = new digitalocean.DnsRecord("do-domain-cname", {
    domain: domain.name,
    type: "CNAME",
    name: "www",
    value: "@",
  });
}

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

