package com.cpaquin.platereview;
import org.junit.Test;
import java.util.*;
import static org.junit.Assert.*;
public class PlateCandidatesTest {
    @Test public void mixedTextFirst(){assertEquals(Arrays.asList("ABC123","SUNFUN"),PlateCandidates.fromLines(Arrays.asList("SUNFUN","ABC 123")));}
    @Test public void ignoresKnownLabels(){assertTrue(PlateCandidates.fromLines(Arrays.asList("ARIZONA","TOYOTA")).isEmpty());}
    @Test public void preservesAmbiguousCharacters(){assertEquals("O0I1",PlateCandidates.fromLines(Arrays.asList("O0I1")).get(0));}
    @Test public void deduplicates(){assertEquals(1,PlateCandidates.fromLines(Arrays.asList("ABC-123","ABC 123")).size());}
    @Test public void filtersLongSentencesAndPunctuation(){assertTrue(PlateCandidates.fromLines(Arrays.asList("SPEED LIMIT 65","HELLO!", "A")).isEmpty());}
    @Test public void allowsVanityAndNumeric(){assertEquals(Arrays.asList("SUNFUN","123456"),PlateCandidates.fromLines(Arrays.asList("SUNFUN","123456")));}
}
