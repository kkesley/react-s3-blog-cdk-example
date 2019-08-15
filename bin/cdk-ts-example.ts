#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { CdkTsExampleStack } from '../lib/cdk-ts-example-stack';

const app = new cdk.App();
new CdkTsExampleStack(app, 'CdkTsExampleStack');
