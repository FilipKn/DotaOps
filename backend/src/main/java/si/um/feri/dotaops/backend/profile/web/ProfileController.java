package si.um.feri.dotaops.backend.profile.web;

import java.net.URI;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import si.um.feri.dotaops.backend.common.api.ApiResponse;
import si.um.feri.dotaops.backend.common.pagination.PageResponse;
import si.um.feri.dotaops.backend.profile.service.ProfileService;

@Validated
@RestController
@RequestMapping("/api")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/profiles")
    ApiResponse<PageResponse<ProfileResponse>> listProfiles(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return ApiResponse.of(profileService.listProfiles(search, page, size));
    }

    @GetMapping("/profiles/{profileId}")
    ApiResponse<ProfileResponse> getProfile(@PathVariable UUID profileId) {
        return ApiResponse.of(profileService.getProfile(profileId));
    }

    @GetMapping("/me/profile")
    ApiResponse<ProfileResponse> getCurrentProfile() {
        return ApiResponse.of(profileService.getCurrentProfile());
    }

    @PostMapping("/me/profile")
    ResponseEntity<ApiResponse<ProfileResponse>> createCurrentProfile(
            @Valid @RequestBody CreateProfileRequest request
    ) {
        ProfileResponse response = profileService.createCurrentProfile(request);

        return ResponseEntity
                .created(URI.create("/api/profiles/" + response.id()))
                .body(ApiResponse.of(response));
    }

    @PatchMapping("/me/profile")
    ApiResponse<ProfileResponse> updateCurrentProfile(
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        return ApiResponse.of(profileService.updateCurrentProfile(request));
    }
}
