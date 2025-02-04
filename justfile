default: list

list:
  @just --list

todo:
  @echo "$todo"

build: cluster-build app-build monitoring-build
destroy: monitoring-destroy app-destroy cluster-destroy


app-info:
    pulumi stack output --cwd ./guestbook --stack demo-app --show-secrets

monitoring-info:
    pulumi stack output --cwd ./monitoring --stack demo-monitoring --show-secrets

cluster-build:
    @echo "Building cluster"
    @if ! pulumi stack ls --cwd ./cluster | grep -q "demo-cluster"; then \
        pulumi stack init --cwd ./cluster --stack demo-cluster; \
    fi
    @pulumi up --cwd ./cluster --stack demo-cluster --yes
    @pulumi stack output --cwd ./cluster --stack demo-cluster --show-secrets kubeconfig > kubeconfig.yml

app-build:
    @echo "Building guestbook app"
    @if ! pulumi stack ls --cwd ./guestbook | grep -q "demo-app"; then \
        pulumi stack init --cwd ./guestbook --stack demo-app; \
    fi
    @pulumi config set --cwd ./guestbook domainName --stack demo-app do.jxp.io
    @pulumi up --cwd ./guestbook --stack demo-app --yes

monitoring-build:
    @echo "Building monitoring with prometheus and grafana"
    @if ! pulumi stack ls --cwd ./monitoring | grep -q "demo-monitoring"; then \
        pulumi stack init --cwd ./monitoring --stack demo-monitoring; \
    fi
    @pulumi config set --cwd ./monitoring domainName --stack demo-monitoring do.jxp.io
    @pulumi up --cwd ./monitoring --stack demo-monitoring --yes

monitoring-destroy:
    @if pulumi stack ls --cwd ./monitoring | grep -q "demo-monitoring"; then \
      echo "Destroying monitoring stack"; \
      pulumi destroy --cwd ./monitoring --stack demo-monitoring; \
      pulumi stack rm --cwd ./cluster --stack demo-monitoring --yes; \
    else \
      echo "No monitoring stack found"; \
    fi

app-destroy:
    @if pulumi stack ls --cwd ./guestbook | grep -q "demo-app"; then \
      echo "Destroying app stack"; \
      pulumi destroy --cwd ./guestbook --stack demo-app; \
      pulumi stack rm --cwd ./guestbook --stack demo-app --yes; \
    else \
      echo "No app stack found"; \
    fi

cluster-destroy:
    @if pulumi stack ls --cwd ./cluster | grep -q "demo-cluster"; then \
      echo "Destroying app"; \
      pulumi destroy --cwd ./cluster --stack demo-cluster; \
      pulumi stack rm --cwd ./monitoring --stack demo-cluster --yes; \
    else \
      echo "No cluster stack found"; \
    fi
