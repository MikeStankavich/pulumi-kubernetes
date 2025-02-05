// portions Copyright 2016-2018, Pulumi Corporation.  All rights reserved.

import * as pulumi from "@pulumi/pulumi";
import * as digitalocean from "@pulumi/digitalocean";
import * as k8s from "@pulumi/kubernetes";

// Enable some configurable parameters.
const config = new pulumi.Config();
const nodeCount = config.getNumber("nodeCount") || 3;

// Provision a DigitalOcean Kubernetes cluster and export its resulting
// kubeconfig to make it easy to access from the kubectl command line.
export const cluster = new digitalocean.KubernetesCluster("do-cluster", {
  region: digitalocean.Region.NYC2,
  version: "1.31.1-do.5",         // pegged the version to get past invalid version slug error
  nodePool: {
    name: "default",
    size: digitalocean.DropletSlug.DropletS2VCPU4GB,
    nodeCount: nodeCount,
  },
});

export const kubeconfig = cluster.kubeConfigs[0].rawConfig;

export const provider = new k8s.Provider("do-k8s",
  { kubeconfig: kubeconfig },
  { dependsOn: cluster }
);

