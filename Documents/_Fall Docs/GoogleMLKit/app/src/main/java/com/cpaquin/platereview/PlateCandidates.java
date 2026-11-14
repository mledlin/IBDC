package com.cpaquin.platereview;
import java.util.*;
/** Simple transparent heuristic, not a plate detector or confidence model. */
public final class PlateCandidates {
    private static final Set<String> STOP = new HashSet<>(Arrays.asList("ARIZONA","GEORGIA","FLORIDA","CALIFORNIA","TEXAS","NEVADA","AMERICA","VETERAN","TRUCK","TOYOTA","HONDA","FORD","NISSAN","SUBARU","CHEVROLET"));
    public static List<String> fromLines(List<String> lines) {
        LinkedHashSet<String> mixed=new LinkedHashSet<>(), other=new LinkedHashSet<>();
        for(String line:lines) {
            String text=line.toUpperCase(Locale.US).trim();
            // Preserve literal recognized characters; only remove spaces/hyphens.
            if(!text.matches("[A-Z0-9 -]+"))continue;
            String value=text.replace(" ","").replace("-","");
            if(value.length()<2 || value.length()>8 || STOP.contains(value))continue;
            if(value.matches(".*[A-Z].*") && value.matches(".*[0-9].*"))mixed.add(value);
            else other.add(value);
        }
        mixed.addAll(other);
        return new ArrayList<>(mixed);
    }
}
