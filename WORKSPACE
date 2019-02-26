workspace(name = "ivy_universal")

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

# Fetch rules_nodejs
# (you can check https://github.com/bazelbuild/rules_nodejs for a newer release than this)
http_archive(
    name = "build_bazel_rules_nodejs",
    sha256 = "1416d03823fed624b49a0abbd9979f7c63bbedfd37890ddecedd2fe25cccebc6",
    urls = ["https://github.com/bazelbuild/rules_nodejs/releases/download/0.18.6/rules_nodejs-0.18.6.tar.gz"],
)

# Setup the NodeJS toolchain
load("@build_bazel_rules_nodejs//:defs.bzl", "node_repositories", "npm_install")
node_repositories()

# Setup Bazel managed npm dependencies with the `yarn_install` rule.
# The name of this rule should be set to `npm` so that `ts_library`
# can find your npm dependencies by default in the `@npm` workspace. You may
# also use the `npm_install` rule with a `package-lock.json` file if you prefer.
# See https://github.com/bazelbuild/rules_nodejs#dependencies for more info.
npm_install(
  name = "npm",
  package_json = "//:package.json",
  package_lock_json = "//:package-lock.json",
)

# Install all Bazel dependencies needed for npm packages that supply Bazel rules
load("@npm//:install_bazel_dependencies.bzl", "install_bazel_dependencies")
install_bazel_dependencies()

# Setup TypeScript toolchain
load("@npm_bazel_typescript//:defs.bzl", "ts_setup_workspace")
ts_setup_workspace()

# Transitive dep of @npm_angular_bazel - should be removed
http_archive(
    name = "io_bazel_rules_webtesting",
    urls = ["https://github.com/bazelbuild/rules_webtesting/releases/download/0.3.0/rules_webtesting.tar.gz"],
    sha256 = "1c0900547bdbe33d22aa258637dc560ce6042230e41e9ea9dad5d7d2fca8bc42",
)

load("@io_bazel_rules_webtesting//web:repositories.bzl", "web_test_repositories")

web_test_repositories()
