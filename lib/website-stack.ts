import * as cdk from '@aws-cdk/core'
import * as s3 from '@aws-cdk/aws-s3'
import * as cf from '@aws-cdk/aws-cloudfront'
import * as iam from '@aws-cdk/aws-iam'

interface WebsiteStackProps extends cdk.StackProps {
  stage: string
}


export class WebsiteStack extends cdk.Stack {
  
  websiteBucket: s3.Bucket
  websiteDistribution: cf.CloudFrontWebDistribution

  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {WebsiteStackProps} props
   */
  constructor(scope: cdk.Construct, id: string, props: WebsiteStackProps) {
    super(scope, id, props);

    const bucket = this.createBucket()
    const cloudfrontOAI = this.createCloudFrontOriginAccessIdentity()
    this.attachBucketPolicy(bucket, cloudfrontOAI)
    const distribution = this.createCloudFrontDistribution(bucket, cloudfrontOAI)
    

    this.websiteBucket = bucket
    this.websiteDistribution = distribution
  }

  createBucket() {
    return new s3.Bucket(this, 'website-bucket', {
      versioned: false,
      encryption: s3.BucketEncryption.KMS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })
  }

  createCloudFrontOriginAccessIdentity() {
    return new cf.CfnCloudFrontOriginAccessIdentity(this, 'oai', {
      cloudFrontOriginAccessIdentityConfig: {
        comment: 'Origin Identity for example website distribution',
      }
    })
  }

  /**
   *
   * @param {s3.Bucket} bucket
   * @param {cf.CfnCloudFrontOriginAccessIdentity} cloudfrontOriginAccessIdentity
   */
  createCloudFrontDistribution(bucket: s3.Bucket, cloudfrontOriginAccessIdentity: cf.CfnCloudFrontOriginAccessIdentity) {
    return new cf.CloudFrontWebDistribution(this, 'website-distribution', {
      originConfigs: [{
        s3OriginSource: {
          s3BucketSource: bucket,
          originAccessIdentityId: cloudfrontOriginAccessIdentity.ref,
        },
        behaviors: [{ isDefaultBehavior: true }]
      }]
    })
  }

  /**
   *
   * @param {s3.Bucket} bucket
   * @param {cf.CfnCloudFrontOriginAccessIdentity} cloudfrontOriginAccessIdentity
   */
  attachBucketPolicy(bucket: s3.Bucket, cloudfrontOriginAccessIdentity: cf.CfnCloudFrontOriginAccessIdentity) {
    const policyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
    })
    policyStatement.addActions('s3:GetObject')
    policyStatement.addResources(`${bucket.bucketArn}/*`)
    policyStatement.addCanonicalUserPrincipal(cloudfrontOriginAccessIdentity.attrS3CanonicalUserId)
    bucket.addToResourcePolicy(policyStatement)
  }
}