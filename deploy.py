import logging
from truefoundry.deploy import (
    NodeSelector,
    LocalSource,
    Build,
    Port,
    DockerFileBuild,
    Service,
    Resources,
    TruefoundryOAuth,
)

logging.basicConfig(level=logging.INFO)

service = Service(
    name="spark-job-fallback-management",
    image=Build(
        build_source=LocalSource(),
        build_spec=DockerFileBuild(
            dockerfile_path="./Dockerfile", build_context_path="./"
        ),
    ),
    resources=Resources(
        cpu_request=0.5,
        cpu_limit=0.5,
        memory_request=1000,
        memory_limit=1000,
        ephemeral_storage_request=500,
        ephemeral_storage_limit=500,
        node=NodeSelector(capacity_type="spot_fallback_on_demand"),
    ),
    env={"PORT": "8000"},
    ports=[
        Port(
            port=8000,
            protocol="TCP",
            expose=True,
            app_protocol="http",
            host="spark-job-fallback-management-vivek-ks-devtest-8000.tfy-usea1-ctl.devtest.truefoundry.tech",
            auth=TruefoundryOAuth(),
        )
    ],
    replicas=1.0,
)


service.deploy(workspace_fqn="tfy-usea1-devtest:vivek-ks-devtest", wait=False)
