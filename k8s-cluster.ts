// portions Copyright 2016-2025, Pulumi Corporation.  All rights reserved.

import * as digitalocean from "@pulumi/digitalocean";
import * as pulumi from "@pulumi/pulumi";


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
