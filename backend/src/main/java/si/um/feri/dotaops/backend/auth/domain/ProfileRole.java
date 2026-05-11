package si.um.feri.dotaops.backend.auth.domain;

import java.util.Locale;

public enum ProfileRole {
    VISITOR("visitor"),
    PLAYER("player"),
    CAPTAIN("captain"),
    ORGANIZER("organizer"),
    ADMIN("admin");

    private final String databaseValue;

    ProfileRole(String databaseValue) {
        this.databaseValue = databaseValue;
    }

    public String databaseValue() {
        return databaseValue;
    }

    public String authority() {
        return "ROLE_" + name();
    }

    public static ProfileRole fromDatabaseValue(String value) {
        if (value == null || value.isBlank()) {
            return VISITOR;
        }

        String normalized = value.trim().toLowerCase(Locale.ROOT);
        for (ProfileRole role : values()) {
            if (role.databaseValue.equals(normalized)) {
                return role;
            }
        }

        throw new IllegalArgumentException("Unknown profile role: " + value);
    }
}
