package si.um.feri.dotaops.backend.auth.service;

import java.util.Optional;
import java.util.UUID;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import si.um.feri.dotaops.backend.auth.domain.AuthenticatedProfile;
import si.um.feri.dotaops.backend.auth.domain.ProfileRole;

@Component
public class CurrentUserProvider {

    public Optional<SupabasePrincipal> currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof SupabasePrincipal supabasePrincipal) {
            return Optional.of(supabasePrincipal);
        }

        return Optional.empty();
    }

    public UUID requireAuthUserId() {
        return currentUser()
                .map(SupabasePrincipal::authUserId)
                .orElseThrow(() -> new AuthenticationCredentialsNotFoundException(
                        "Authenticated Supabase user is required."));
    }

    public AuthenticatedProfile requireProfile() {
        return currentUser()
                .flatMap(SupabasePrincipal::profile)
                .orElseThrow(() -> new AccessDeniedException("DotaOps profile is required."));
    }

    public UUID requireProfileId() {
        return requireProfile().profileId();
    }

    public ProfileRole role() {
        return currentUser()
                .map(SupabasePrincipal::role)
                .orElse(ProfileRole.VISITOR);
    }
}
