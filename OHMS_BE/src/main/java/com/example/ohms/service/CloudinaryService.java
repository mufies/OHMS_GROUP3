package com.example.ohms.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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
}
