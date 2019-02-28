## Deployment

Run it under docker:

```
$ bazel run src:server_image -- --norun
$ docker run --rm -it -p 8080:8080 bazel/src:server_image
```

Deploy to production:

1. Install gcloud and kubectl
1. Authenticate to the Google Container Registry
    `gcloud auth configure-docker`
1. Authenticate to Kubernetes Engine
    `gcloud container clusters get-credentials photon-demo --zone=us-west1-a`
1. For the first deployment: `bazel run :deploy.create`
1. To update: `bazel run :deploy.replace`

Tips:

```
# Run the binary without docker
$ bazel run src:nodejs_image.binary
 # What's in the image?
$ bazel build src:nodejs_image && file-roller dist/bin/src/nodejs_image-layer.tar
 # Tear down all running docker containers
$ docker rm -f $(docker ps -aq)
 # Hop into the running image on kubernetes
$ kubectl exec photon-demo-prod-3285254973-ncv3g  -it -- /bin/bash
```
