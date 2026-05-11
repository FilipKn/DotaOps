package si.um.feri.dotaops.backend.auth.web;

import java.io.IOException;
import java.util.Optional;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import si.um.feri.dotaops.backend.auth.domain.AuthenticatedProfile;
import si.um.feri.dotaops.backend.auth.domain.SupabaseJwtClaims;
import si.um.feri.dotaops.backend.auth.repository.AuthenticatedProfileRepository;
import si.um.feri.dotaops.backend.auth.service.SupabaseAuthorities;
import si.um.feri.dotaops.backend.auth.service.SupabaseJwtVerifier;
import si.um.feri.dotaops.backend.auth.service.SupabasePrincipal;

@Component
public class SupabaseJwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final SupabaseJwtVerifier jwtVerifier;
    private final AuthenticatedProfileRepository profileRepository;
    private final AuthenticationEntryPoint authenticationEntryPoint;

    public SupabaseJwtAuthenticationFilter(
            SupabaseJwtVerifier jwtVerifier,
            AuthenticatedProfileRepository profileRepository,
            AuthenticationEntryPoint authenticationEntryPoint
    ) {
        this.jwtVerifier = jwtVerifier;
        this.profileRepository = profileRepository;
        this.authenticationEntryPoint = authenticationEntryPoint;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String authorizationHeader = request.getHeader(AUTHORIZATION_HEADER);

        if (!StringUtils.hasText(authorizationHeader)) {
            filterChain.doFilter(request, response);
            return;
        }

        if (!authorizationHeader.startsWith(BEARER_PREFIX)) {
            reject(request, response, new BadCredentialsException("Authorization header must use Bearer token."));
            return;
        }

        try {
            SupabaseJwtClaims claims = jwtVerifier.verify(authorizationHeader.substring(BEARER_PREFIX.length()));
            Optional<AuthenticatedProfile> profile = profileRepository.findByAuthUserId(claims.authUserId());
            SupabasePrincipal principal = new SupabasePrincipal(
                    claims.authUserId(),
                    claims.email(),
                    profile,
                    claims);

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    principal,
                    null,
                    SupabaseAuthorities.from(profile));
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            filterChain.doFilter(request, response);
        } catch (AuthenticationException exception) {
            SecurityContextHolder.clearContext();
            reject(request, response, exception);
        }
    }

    private void reject(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception
    ) throws IOException, ServletException {
        authenticationEntryPoint.commence(request, response, exception);
    }
}
