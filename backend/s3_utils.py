import os
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv
from typing import BinaryIO, Optional

load_dotenv()

AWS_REGION = os.getenv("AWS_REGION", "eu-north-1")
S3_BUCKET = os.getenv("S3_BUCKET")
S3_PREFIX = os.getenv("S3_PREFIX", "podcasts/")

if not S3_BUCKET:
    raise ValueError("S3_BUCKET must be set in environment variables")

# Initialize S3 client
s3_client = boto3.client("s3", region_name=AWS_REGION)


def upload_fileobj(fileobj: BinaryIO, key: str, content_type: Optional[str] = None) -> str:
    """
    Upload a file-like object to S3 and return the public URL.
    
    Args:
        fileobj: File-like object to upload
        key: S3 object key (filename)
        content_type: MIME type of the file
        
    Returns:
        S3 URL of the uploaded file
    """
    extra_args = {}
    if content_type:
        extra_args["ContentType"] = content_type

    # Add prefix if configured
    if S3_PREFIX:
        key = f"{S3_PREFIX.rstrip('/')}/{key}"

    try:
        s3_client.upload_fileobj(fileobj, S3_BUCKET, key, ExtraArgs=extra_args)
        # Construct S3 URL (virtual-hosted style)
        url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{key}"
        return url
    except ClientError as e:
        raise RuntimeError(f"Failed to upload to S3: {str(e)}")


def generate_presigned_upload_url(key: str, expires_in: int = 3600, 
                                   content_type: Optional[str] = None) -> str:
    """
    Generate a presigned PUT URL for direct client uploads to S3.
    
    Args:
        key: S3 object key (filename)
        expires_in: URL expiration time in seconds (default 1 hour)
        content_type: MIME type of the file
        
    Returns:
        Presigned URL for uploading
    """
    if S3_PREFIX:
        key = f"{S3_PREFIX.rstrip('/')}/{key}"

    params = {"Bucket": S3_BUCKET, "Key": key}
    if content_type:
        params["ContentType"] = content_type

    try:
        url = s3_client.generate_presigned_url(
            "put_object",
            Params=params,
            ExpiresIn=expires_in
        )
        return url
    except ClientError as e:
        raise RuntimeError(f"Failed to generate presigned URL: {str(e)}")


def generate_presigned_download_url(key: str, expires_in: int = 3600) -> str:
    """
    Generate a presigned GET URL for downloading from S3.
    
    Args:
        key: S3 object key (filename)
        expires_in: URL expiration time in seconds (default 1 hour)
        
    Returns:
        Presigned URL for downloading
    """
    if S3_PREFIX and not key.startswith(S3_PREFIX):
        key = f"{S3_PREFIX.rstrip('/')}/{key}"

    try:
        url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": S3_BUCKET, "Key": key},
            ExpiresIn=expires_in
        )
        return url
    except ClientError as e:
        raise RuntimeError(f"Failed to generate presigned download URL: {str(e)}")


def delete_file(key: str) -> bool:
    """
    Delete a file from S3.
    
    Args:
        key: S3 object key (filename)
        
    Returns:
        True if successful, False otherwise
    """
    if S3_PREFIX and not key.startswith(S3_PREFIX):
        key = f"{S3_PREFIX.rstrip('/')}/{key}"

    try:
        s3_client.delete_object(Bucket=S3_BUCKET, Key=key)
        return True
    except ClientError as e:
        print(f"Failed to delete from S3: {str(e)}")
        return False


def download_fileobj(key: str) -> bytes:
    """
    Download a file from S3 and return as bytes.
    
    Args:
        key: S3 object key (filename)
        
    Returns:
        File contents as bytes
    """
    if S3_PREFIX and not key.startswith(S3_PREFIX):
        key = f"{S3_PREFIX.rstrip('/')}/{key}"

    try:
        response = s3_client.get_object(Bucket=S3_BUCKET, Key=key)
        return response['Body'].read()
    except ClientError as e:
        raise RuntimeError(f"Failed to download from S3: {str(e)}")


def file_exists(key: str) -> bool:
    """
    Check if a file exists in S3.
    
    Args:
        key: S3 object key (filename)
        
    Returns:
        True if file exists, False otherwise
    """
    if S3_PREFIX and not key.startswith(S3_PREFIX):
        key = f"{S3_PREFIX.rstrip('/')}/{key}"

    try:
        s3_client.head_object(Bucket=S3_BUCKET, Key=key)
        return True
    except ClientError:
        return False


def upload_file(file_path: str, key: str, content_type: Optional[str] = None) -> str:
    """
    Upload a file from disk to S3 and return the public URL.
    
    Args:
        file_path: Path to file on disk
        key: S3 object key (filename)
        content_type: MIME type of the file
        
    Returns:
        S3 URL of the uploaded file
    """
    extra_args = {}
    if content_type:
        extra_args["ContentType"] = content_type

    # Add prefix if configured
    if S3_PREFIX:
        key = f"{S3_PREFIX.rstrip('/')}/{key}"

    try:
        s3_client.upload_file(file_path, S3_BUCKET, key, ExtraArgs=extra_args)
        # Construct S3 URL
        url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{key}"
        return url
    except ClientError as e:
        raise RuntimeError(f"Failed to upload to S3: {str(e)}")
