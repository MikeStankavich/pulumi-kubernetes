// portions Copyright 2016-2018, Pulumi Corporation.  All rights reserved.

import {cluster} from "./cluster";
import {domain} from "./domain";
import {frontend} from "./guestbook";
import{adminUser,adminPass} from "./monitoring";

import * as pulumi from "@pulumi/pulumi";

export const kubeconfig = cluster.kubeConfigs[0].rawConfig;
export const domainName = domain.name;
export const guestbookIp = frontend.ipAddress;
export const guestbookUrl = pulumi.interpolate `http://${domainName}`;

export const grafanaUrl = pulumi.interpolate `http://grafana.${domainName}`;
export const grafanaAdminUser = adminUser
export const grafanaAdminPass = adminPass
