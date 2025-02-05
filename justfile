export PULUMI_STACK := "demo"
export DOMAIN_NAME := "do.jxp.io"

default: list

list:
  @just --list

build:
    @echo "Building cluster"
    @if [[ $(pulumi stack ls -j | jq -r ".[] | select(.name == \"$PULUMI_STACK\") | .name") != "$PULUMI_STACK" ]]; then \
        pulumi stack init --stack $PULUMI_STACK; \
        pulumi stack select $PULUMI_STACK; \
        pulumi config set domainName $DOMAIN_NAME; \
    fi
    @pulumi up --yes
    @pulumi stack output --show-secrets kubeconfig > kubeconfig.yml

destroy:
    @if [[ $(pulumi stack ls -j | jq -r ".[] | select(.name == \"$PULUMI_STACK\") | .name") == "$PULUMI_STACK" ]]; then \
      echo "Destroying cluster"; \
      pulumi destroy; \
      pulumi stack rm --stack $PULUMI_STACK; \
      rm kubeconfig.yml; \
    else \
      echo "Pulumi stack $PULUMI_STACK not found"; \
    fi

open:
    @open "http://$DOMAIN_NAME"
    @open "http://grafana.$DOMAIN_NAME"

outputs:
    @pulumi stack output --show-secrets | grep -E --color=never '(OUTPUT|grafana|guestbook)'
