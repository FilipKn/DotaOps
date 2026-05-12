package si.um.feri.dotaops.backend.opendota.domain;

public record MatchPlayerImport(
        String steamAccountId,
        Integer dotaHeroId,
        int playerSlot,
        Boolean radiant,
        Boolean winner,
        int kills,
        int deaths,
        int assists,
        int lastHits,
        int denies,
        Integer goldPerMinute,
        Integer experiencePerMinute,
        Integer netWorth,
        Integer heroDamage,
        Integer towerDamage,
        Integer heroHealing,
        Integer level,
        Integer durationSeconds,
        String rawPlayer
) {
}
