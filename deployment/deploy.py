#!/usr/bin/env python3
"""
Cluster Management - TrueFoundry Deployment Script

Deploys the persistent volume and/or service to a TrueFoundry workspace.
Combines volume creation and service deployment into a single CLI.

Run with --help for full usage details and examples.
"""

import argparse
import logging
import sys

from truefoundry.deploy import (
    Build,
    DockerFileBuild,
    DynamicVolumeConfig,
    Endpoint,
    GitSource,
    LocalSource,
    NodeSelector,
    Port,
    Resources,
    Service,
    TrueFoundryInteractiveLogin,
    Volume,
    VolumeBrowser,
    VolumeMount,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def deploy_volume(args):
    """Create and deploy the persistent volume for cluster management data."""
    volume_browser = None
    if args.volume_host:
        volume_browser = VolumeBrowser(endpoint=Endpoint(host=args.volume_host))

    volume = Volume(
        name=args.volume_name,
        config=DynamicVolumeConfig(
            storage_class=args.storage_class,
            size=args.volume_size,
        ),
        volume_browser=volume_browser,
        workspace_fqn=args.workspace_fqn,
    )

    logger.info("Deploying volume '%s' to workspace '%s'...", args.volume_name, args.workspace_fqn)
    volume.deploy(workspace_fqn=args.workspace_fqn, wait=args.wait)
    logger.info("Volume deployment initiated.")


def deploy_service(args):
    """Create and deploy the cluster management service."""
    volume_fqn = args.volume_fqn or f"tfy-volume://{args.workspace_fqn}:{args.volume_name}"

    if args.local:
        build_source = LocalSource(local_build=False)
    else:
        build_source = GitSource(
            repo_url=args.repo_url,
            ref=args.ref,
            branch_name=args.branch,
        )

    service = Service(
        name=args.service_name,
        image=Build(
            build_source=build_source,
            build_spec=DockerFileBuild(
                dockerfile_path=args.dockerfile_path,
                build_context_path=args.build_context,
            ),
        ),
        resources=Resources(
            cpu_request=args.cpu_request,
            cpu_limit=args.cpu_limit,
            memory_request=args.memory_request,
            memory_limit=args.memory_limit,
            ephemeral_storage_request=args.ephemeral_storage_request,
            ephemeral_storage_limit=args.ephemeral_storage_limit,
            node=NodeSelector(capacity_type=args.capacity_type),
        ),
        env={
            "PORT": str(args.port),
            "DATA_DIR": "/app/data",
            "NODE_ENV": "production",
            "SFY_ASSUMED_USER": "truefoundry",
            "TRUEFOUNDRY_API_URL": args.truefoundry_api_url.rstrip("/") + "/api/svc",
            "TF_SERVICE_API_TOKEN": args.api_token,
            "JOB_FALLBACK_ENABLED": str(args.job_fallback_enabled).lower(),
            "JOB_FALLBACK_TRIGGER_DELAY_MS": str(args.job_fallback_delay),
            "JOB_FALLBACK_TRIGGER_MAX_RETRIES": str(args.job_fallback_retries),
            "JOB_FALLBACK_TRIGGER_RETRY_DELAY_MS": str(args.job_fallback_retry_delay),
        },
        ports=[
            Port(
                port=args.port,
                protocol="TCP",
                expose=True,
                app_protocol="http",
                host=args.service_host or None,
                auth=TrueFoundryInteractiveLogin(),
            )
        ],
        mounts=[
            VolumeMount(
                mount_path="/app/data",
                volume_fqn=volume_fqn,
            )
        ],
        workspace_fqn=args.workspace_fqn,
        replicas=args.replicas,
    )

    logger.info("Deploying service '%s' to workspace '%s'...", args.service_name, args.workspace_fqn)
    service.deploy(workspace_fqn=args.workspace_fqn, wait=args.wait)
    logger.info("Service deployment initiated.")


def build_parser():
    parser = argparse.ArgumentParser(
        description="Deploy Cluster Management to TrueFoundry",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
examples:
  # Deploy everything (volume first, then service)
  python deploy.py all \\
      --workspace-fqn <cluster>:<workspace> \\
      --truefoundry-api-url https://<control-plane>/api/svc \\
      --api-token 'tfy-secret://<tenant>:<secret-group>:<key>'

  # Deploy only the volume
  python deploy.py volume \\
      --workspace-fqn <cluster>:<workspace>

  # Deploy only the service (volume must already exist)
  python deploy.py service \\
      --workspace-fqn <cluster>:<workspace> \\
      --truefoundry-api-url https://<control-plane>/api/svc \\
      --api-token 'tfy-secret://<tenant>:<secret-group>:<key>'

  # Deploy service from local source instead of git
  python deploy.py service \\
      --workspace-fqn <cluster>:<workspace> \\
      --truefoundry-api-url https://<control-plane>/api/svc \\
      --api-token 'tfy-secret://<tenant>:<secret-group>:<key>' \\
      --local

  # Override resource limits and replicas
  python deploy.py service \\
      --workspace-fqn <cluster>:<workspace> \\
      --truefoundry-api-url https://<control-plane>/api/svc \\
      --api-token 'tfy-secret://<tenant>:<secret-group>:<key>' \\
      --cpu-limit 1.0 --memory-limit 1000 --replicas 2
        """,
    )

    parser.add_argument(
        "action",
        choices=["volume", "service", "all"],
        help="what to deploy: 'volume', 'service', or 'all' (volume then service)",
    )

    # ── Required ─────────────────────────────────────────────────────────
    required = parser.add_argument_group("required")
    required.add_argument(
        "--workspace-fqn",
        required=True,
        help="TrueFoundry workspace FQN  (format: <cluster>:<workspace>)",
    )

    # ── Service configuration ────────────────────────────────────────────
    svc = parser.add_argument_group("service configuration")
    svc.add_argument(
        "--truefoundry-api-url",
        default=None,
        help="TrueFoundry control-plane URL  (e.g. https://<host>.truefoundry.tech)",
    )
    svc.add_argument(
        "--api-token",
        default=None,
        help="API token or secret FQN  (e.g. tfy-secret://<tenant>:<group>:<key>)",
    )
    svc.add_argument("--service-name", default="cluster-management", help="service name  (default: cluster-management)")
    svc.add_argument("--service-host", default=None, help="service endpoint host  (auto-generated if omitted)")
    svc.add_argument("--port", type=int, default=8000, help="service port  (default: 8000)")
    svc.add_argument("--replicas", type=int, default=1, help="number of replicas  (default: 1)")

    # ── Build source ─────────────────────────────────────────────────────
    build = parser.add_argument_group("build source")
    build.add_argument("--local", action="store_true", help="build from local source instead of git")
    build.add_argument(
        "--repo-url",
        default="https://github.com/truefoundry/comcast-cluster-management",
        help="git repository URL",
    )
    build.add_argument("--ref", default="main", help="git ref — branch, tag, or commit SHA  (default: main)")
    build.add_argument("--branch", default="main", help="git branch name  (default: main)")
    build.add_argument("--dockerfile-path", default="./Dockerfile", help="path to Dockerfile  (default: ./Dockerfile)")
    build.add_argument("--build-context", default="./", help="Docker build context  (default: ./)")

    # ── Volume configuration ─────────────────────────────────────────────
    vol = parser.add_argument_group("volume configuration")
    vol.add_argument("--volume-name", default="cluster-management-data", help="volume name  (default: cluster-management-data)")
    vol.add_argument("--volume-host", default=None, help="volume browser endpoint host  (optional)")
    vol.add_argument("--volume-fqn", default=None, help="explicit volume FQN  (derived from workspace + volume name if omitted)")
    vol.add_argument("--storage-class", default="efs-sc", help="storage class  (default: efs-sc)")
    vol.add_argument("--volume-size", type=int, default=1, help="volume size in GB  (default: 1)")

    # ── Resources ────────────────────────────────────────────────────────
    res = parser.add_argument_group("resource limits")
    res.add_argument("--cpu-request", type=float, default=0.2, help="CPU request  (default: 0.2)")
    res.add_argument("--cpu-limit", type=float, default=0.5, help="CPU limit  (default: 0.5)")
    res.add_argument("--memory-request", type=int, default=200, help="memory request in MB  (default: 200)")
    res.add_argument("--memory-limit", type=int, default=500, help="memory limit in MB  (default: 500)")
    res.add_argument("--ephemeral-storage-request", type=int, default=1000, help="ephemeral storage request in MB  (default: 1000)")
    res.add_argument("--ephemeral-storage-limit", type=int, default=2000, help="ephemeral storage limit in MB  (default: 2000)")
    res.add_argument("--capacity-type", default="spot_fallback_on_demand", help="node capacity type  (default: spot_fallback_on_demand)")

    # ── Job fallback settings ────────────────────────────────────────────
    jf = parser.add_argument_group("job fallback scheduler")
    jf.add_argument("--job-fallback-enabled", type=bool, default=True, help="enable job fallback  (default: true)")
    jf.add_argument("--job-fallback-delay", type=int, default=15000, help="trigger delay in ms  (default: 15000)")
    jf.add_argument("--job-fallback-retries", type=int, default=3, help="max retries  (default: 3)")
    jf.add_argument("--job-fallback-retry-delay", type=int, default=15000, help="retry delay in ms  (default: 15000)")

    # ── General ──────────────────────────────────────────────────────────
    parser.add_argument("--wait", action="store_true", help="wait for deployment to complete before returning")

    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()

    if args.action in ("service", "all"):
        if not args.truefoundry_api_url:
            parser.error("--truefoundry-api-url is required when deploying the service")
        if not args.api_token:
            parser.error("--api-token is required when deploying the service")

    if args.action in ("volume", "all"):
        deploy_volume(args)

    if args.action in ("service", "all"):
        deploy_service(args)

    logger.info("Done.")


if __name__ == "__main__":
    main()
