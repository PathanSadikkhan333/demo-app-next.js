type ImageUploadProps = {
  endpoint: string;
  value: string;
  onChange: (url: string) => void;
};

function ImageUpload({ endpoint, value, onChange }: ImageUploadProps) {
  return (
    <div>
      {/* your actual upload UI here */}
      <input
        type="file"
        onChange={e => {
          // upload/image handling logic
          // then call onChange with new URL
        }}
      />
      {value && <img src={value} alt="Uploaded" />}
    </div>
  );
}

export default ImageUpload;
