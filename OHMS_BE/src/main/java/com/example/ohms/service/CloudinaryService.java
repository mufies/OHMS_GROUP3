package com.example.ohms.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService() {
        // hardcode thẳng luôn
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", "dns5ahcoz",
                "api_key", "386731843649862",
                "api_secret", "SRucN18PLONt5WXdvo2dIVR5JnQ"
        ));
    }

    public String uploadFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is null or empty");
        }
        log.info("Uploading file to Cloudinary: name={}, size={}", file.getOriginalFilename(), file.getSize());
        Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap("resource_type", "auto"));
        String secureUrl = uploadResult.get("secure_url").toString();
        log.info("Uploaded file URL: {}", secureUrl);
        return secureUrl;
    }

    public String deleteFile(String publicId) throws IOException {
        log.info("Deleting file from Cloudinary: publicId={}", publicId);
        Map<String, Object> result = cloudinary.uploader().destroy(publicId,
                ObjectUtils.asMap("resource_type", "image"));
        return result.get("result").toString();
    }
    // Trong CloudinaryService (thêm method này nếu chưa)
public List<String> uploadMulti(List<byte[]> imageBytesList) throws IOException {
        List<String> imageUrls = new ArrayList<>();
        
        for (byte[] imageBytes : imageBytesList) {
            String url = uploadFromBytes(imageBytes);  // Gọi không param String
            imageUrls.add(url);
        }
        return imageUrls;
    }

// Và method uploadFromBytes (update để bỏ fileName nếu không cần)
public String uploadFromBytes(byte[] imageBytes) throws IOException {  // Bỏ param fileName
    if (imageBytes == null || imageBytes.length == 0) {
        throw new IllegalArgumentException("Image bytes is null or empty");
    }
    log.info("Uploading image bytes to Cloudinary: size={}", imageBytes.length);
    Map<String, Object> params = ObjectUtils.asMap(
        "resource_type", "auto",
        "folder", "chat_images"  // Folder mày đã set
    );
    // Không set public_id, Cloudinary tự generate
    Map<String, Object> uploadResult = cloudinary.uploader().upload(imageBytes, params);
    String secureUrl = uploadResult.get("secure_url").toString();
    log.info("Uploaded image URL: {}", secureUrl);
    return secureUrl;
}
}
