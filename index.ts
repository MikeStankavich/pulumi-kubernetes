// portions Copyright 2016-2018, Pulumi Corporation.  All rights reserved.

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
