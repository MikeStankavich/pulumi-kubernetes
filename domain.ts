// portions Copyright 2016-2018, Pulumi Corporation.  All rights reserved.

import * as pulumi from "@pulumi/pulumi";
import * as digitalocean from "@pulumi/digitalocean";

// Enable some configurable parameters.
const config = new pulumi.Config();
const domainName = pulumi.interpolate `${config.get('domainName')}`;

export const domain = new digitalocean.Domain("do-domain", {
  name: domainName,
});

const cnameRecord = new digitalocean.DnsRecord("do-domain-cname", {
  domain: domain.name,
  type: "CNAME",
  name: "www",
  value: "@",
});
