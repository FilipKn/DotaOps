package si.um.feri.dotaops.backend.auth.steam.web;

import java.net.URI;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import si.um.feri.dotaops.backend.auth.steam.domain.SteamAuthResult;
import si.um.feri.dotaops.backend.auth.steam.service.SteamAuthService;
import si.um.feri.dotaops.backend.common.api.ApiResponse;

@RestController
@RequestMapping("/api/auth/steam")
public class SteamAuthController {

    private final SteamAuthService steamAuthService;

    public SteamAuthController(SteamAuthService steamAuthService) {
        this.steamAuthService = steamAuthService;
    }

    @GetMapping("/login")
    ResponseEntity<Void> login(HttpServletRequest request) {
        URI redirectUri = steamAuthService.beginLogin(request);

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(redirectUri)
                .build();
    }

    @GetMapping("/callback")
    ResponseEntity<?> callback(@RequestParam MultiValueMap<String, String> params) {
        SteamAuthResult result = steamAuthService.completeCallback(params);
        if (result.redirectUri() != null) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(result.redirectUri())
                    .build();
        }

        return ResponseEntity.ok(ApiResponse.of(SteamAuthResponse.from(result)));
    }
}
