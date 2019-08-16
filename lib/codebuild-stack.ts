import * as cdk from '@aws-cdk/core'
import * as s3 from '@aws-cdk/aws-s3'
import * as iam from '@aws-cdk/aws-iam'
import * as cb from '@aws-cdk/aws-codebuild'
import * as cf from '@aws-cdk/aws-cloudfront'

interface CodeBuildStackProps extends cdk.StackProps {
    stage: string,
    bucket: s3.Bucket,
    distribution: cf.CloudFrontWebDistribution
}
  

export class CodeBuildStack extends cdk.Stack {

  buildProject: cb.Project

  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {CodeBuildStackProps} props
   */
  constructor(scope: cdk.Construct, id: string, props: CodeBuildStackProps) {
    super(scope, id, props);

    const filter = cb.FilterGroup
                      .inEventOf(cb.EventAction.PUSH)
                      .andBranchIs(props.stage)

    const build = new cb.Project(this, 'website-builder', {
        source: cb.Source.gitHub({ 
          owner: 'kkesley', 
          repo: 'react-s3-blog-example', 
          webhookFilters: [ filter ] 
        }),
        cache: cb.Cache.local(cb.LocalCacheMode.CUSTOM),
        environment: {
            buildImage: cb.LinuxBuildImage.STANDARD_2_0,
            computeType: cb.ComputeType.SMALL,
        }
    })
    this.addS3Permission(build, props.bucket)
    this.addCloudFrontPermission(build, props.distribution)

    this.buildProject = build
  }

  /**
   *
   * @param {cb.Project} project
   * @param {s3.Bucket} bucket
   */
  addS3Permission(project: cb.Project, bucket: s3.Bucket) {
    const policyStatement = new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
    })
    policyStatement.addActions('s3:putObject')
    policyStatement.addResources(`${bucket.bucketArn}/*`)
    project.addToRolePolicy(policyStatement)
  }

  /**
   *
   * @param {cb.Project} project
   * @param {cf.CloudFrontWebDistribution} distribution
   */
  addCloudFrontPermission(project: cb.Project, distribution: cf.CloudFrontWebDistribution) {
    const policyStatement = new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
    })
    policyStatement.addActions('cloudfront:CreateInvalidation')
    policyStatement.addResources(cdk.Arn.format({
        service: 'cloudfront',
        region: '',
        resource: 'distribution',
        sep: '/',
        resourceName: distribution.distributionId
    }, this))
    project.addToRolePolicy(policyStatement)
  }
}