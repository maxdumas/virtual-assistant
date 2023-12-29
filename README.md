# Virtual Assistant

## Useful commands

* `bun build`   emits the synthesized CloudFormation template or `bun cdk synth`
* `bun watch`   watch for changes and compile
* `bun run test`    perform the vitest unit tests (NOTE: `bun test` would run the `bun test` instead of vitest)
* `bun cdk deploy:all`  deploy this stack to your default AWS account/region
  * Use `AWS_PROFILE=my-profile bun cdk deploy:all` when deploying using an profile
  * Use `bun cdk:only` when deploying a single Stack (default is `BunFunStack`)
  * Use `STACK=MyCustomStack bun cdk:only` when deploying a single `MyCustomStack` Stack
* `bun cdk diff`    compare deployed stack with current state
* `bun cdk synth`   emits the synthesized CloudFormation template

## Bun Runtime Layer

Layer was last published from (this commit)[https://github.com/oven-sh/bun/tree/1a2643520b216c4c95b7543ed62d4fed30882ce3/packages/bun-lambda].