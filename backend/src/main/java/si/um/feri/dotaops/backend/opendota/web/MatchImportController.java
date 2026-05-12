package si.um.feri.dotaops.backend.opendota.web;

import java.net.URI;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import si.um.feri.dotaops.backend.common.api.ApiResponse;
import si.um.feri.dotaops.backend.opendota.service.MatchImportService;

@RestController
@RequestMapping("/api/match-imports")
public class MatchImportController {

    private final MatchImportService matchImportService;

    public MatchImportController(MatchImportService matchImportService) {
        this.matchImportService = matchImportService;
    }

    @PostMapping
    ResponseEntity<ApiResponse<MatchImportResponse>> importMatch(
            @Valid @RequestBody CreateMatchImportRequest request
    ) {
        MatchImportResponse response = matchImportService.importMatch(request);

        return ResponseEntity
                .created(URI.create("/api/match-imports/" + response.id()))
                .body(ApiResponse.of(response));
    }
}
