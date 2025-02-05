// portions Copyright 2016-2018, Pulumi Corporation.  All rights reserved.

import * as pulumi from "@pulumi/pulumi";
import * as digitalocean from "@pulumi/digitalocean";

// Enable some configurable parameters.
const config = new pulumi.Config();
const nodeCount = config.getNumber("nodeCount") || 3;
const domainName = config.get("domainName");

// Provision a DigitalOcean Kubernetes cluster and export its resulting
// kubeconfig to make it easy to access from the kubectl command line.
const cluster = new digitalocean.KubernetesCluster("do-cluster", {
  region: digitalocean.Region.NYC2,
  version: "1.31.1-do.5",         // pegged the version to get past invalid version slug error
  nodePool: {
    name: "default",
    size: digitalocean.DropletSlug.DropletS2VCPU4GB,
    nodeCount: nodeCount,
  },
});

export const kubeconfig = cluster.kubeConfigs[0].rawConfig;

if (domainName) {
  const domain = new digitalocean.Domain("do-domain", {
    name: domainName,
  });
}