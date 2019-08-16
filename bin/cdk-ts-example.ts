#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { WebsiteStack } from '../lib/website-stack'
import { CodeBuildStack } from '../lib/codebuild-stack';
import * as fse from 'fs-extra'

class Application extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);
        const webStack = new WebsiteStack(app, `website-stack-${id}`, { stage: id })
        const buildStack = new CodeBuildStack(app, `codebuild-stack-${id}`, { stage:id, bucket: webStack.websiteBucket, distribution: webStack.websiteDistribution });
        this.generateBuildParameter(id, webStack, buildStack)
    }
    
    generateBuildParameter(id: string, webStack: WebsiteStack, buildStack: CodeBuildStack) {
        const buildParam = {
            projectName: buildStack.buildProject.projectName,
            sourceVersion: id,
            environmentVariablesOverride: [
              { name: "STAGE", value: id, type: "PLAINTEXT" },
              { name: "WEBSITE_BUCKET", value: webStack.websiteBucket.bucketName, type: "PLAINTEXT" },
              { name: "CLOUDFRONT_DISTRIBUTION_ID", value: webStack.websiteDistribution.distributionId, "type": "PLAINTEXT" }
            ],
            buildspecOverride: "./buildspec.yml"
        }
        fse.outputJson(`./cdk.out/build-parameters/build-${id}.json`, buildParam, (err: Error) => {
            if (err) {
                throw err
            };
            console.log(`build parameter has been created in "../cdk.out/build-parameters/build-${id}.json"`);
        })
    }
}

const app = new cdk.App();
const stage = app.node.tryGetContext('stage')

if (!stage) {
    throw new Error("You need to provide stage ['master', 'dev']")
}
new Application(app, stage)

