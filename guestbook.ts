// portions Copyright 2016-2018, Pulumi Corporation.  All rights reserved.

import * as k8s from "@pulumi/kubernetes";
import * as k8sService from "./k8s-service";
import {provider} from "./cluster";

// import {kubeconfig} from "./cluster";
// does this behave if i dont share provider between modules?
// const provider = new k8s.Provider("do-k8s-app", { kubeconfig: kubeconfig });

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

export const frontend = new k8sService.ServiceDeployment("frontend", {
    replicas: 3,
    image: "pulumi/guestbook-php-redis",
    ports: [80],
    allocateIpAddress: true,
    dnsName: "@"
  },
  {provider: provider});
