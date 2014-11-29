<?php
    // Copyright (C) 2014 Vladimir P.
    
    define('DATA_JSON_FILE', 'data.json');
    
    $data = [];
    
    
    // Heart
    $points = getPoints(function($t) {
        $scale = 100;
        $t *= 2*M_PI;
        // Madeloid formula is from http://johnthemathguy.blogspot.com/2013/02/the-function-of-heart.html
        $n = M_PI - abs(M_PI - $t);
        $p = 2.0 * (1 - $n / M_PI) + 0.3 * $n * (M_PI - $n) + 0.6 * $n * (M_PI - $n) * ($n - M_PI / 2);
        return [ -$p * sin($t) * $scale, $p * cos($t) * $scale ];
    }, 50, 100);
    $data[] = [ 'p' => $points, 'a' => getAngles($points) ];
    
    // Flower
    $flowerSections = 6;
    $points = getPoints(function($t) {
        global $flowerSections;
        $innerRadius = 100;
        $outerRadius = 200;
        $ratio = fmod($t * $flowerSections, 1);
        $r = lerp($innerRadius, $outerRadius, cos($ratio * 2*M_PI) / 2 + 0.5);
        $a = 2*M_PI * $t;
        return [ $r * cos($a), $r * sin($a) ];
    }, 8 * $flowerSections, 10);
    $data[] = [ 'p' => $points, 'a' => getAngles($points) ];
    
    // Star
    $starSections = 5;
    $points = getPoints(function($t) {
        global $starSections;
        $innerRadius = 100;
        $outerRadius = 200;
        $ratio = fmod($t * $starSections, 1);
        $r = lerp($innerRadius, $outerRadius, pow($ratio < 0.5 ? $ratio * 2 : 1 - ($ratio - 0.5) * 2, 2));
        $a = 2*M_PI * $t;
        return [ $r * cos($a), $r * sin($a) ];
    }, 8 * $starSections, 10);
    $data[] = [ 'p' => $points, 'a' => getAngles($points) ];
    
    
    file_put_contents(DATA_JSON_FILE, json_encode($data));
    
    
    function getPoints($curve, $count, $attemptsToMakePointsEquidistant) {
        $parameters = [];
        for($i = 0; $i < $count; ++$i)
            $parameters[] = $i / $count;
        
        // Make sure that all parameters yield points that are equal distance from one another.
        // See http://math.stackexchange.com/questions/15896/ .
        for($i = 0; $i < $attemptsToMakePointsEquidistant; ++$i) {
            for($j = 1; $j < $count - 1; ++$j) {
                $prev = $curve($parameters[$j - 1]);
                $curr = $curve($parameters[$j]);
                $next = $curve($parameters[$j + 1]);
                
                $distPrevCurr = sqrt(pow($prev[0] - $curr[0], 2) + pow($prev[1] - $curr[1], 2));
                $distCurrNext = sqrt(pow($next[0] - $curr[0], 2) + pow($next[1] - $curr[1], 2));
                
                $r = 0.5 * ($distCurrNext - $distPrevCurr) / ($distPrevCurr + $distCurrNext);
                if($r > 0)
                    $parameters[$j] += $r * ($parameters[$j + 1] - $parameters[$j]);
                elseif($r < 0)
                    $parameters[$j] += $r * ($parameters[$j] - $parameters[$j - 1]);
            }
        }
        
        $points = [];
        for($i = 0; $i < $count; ++$i) {
            list($x, $y) = $curve($parameters[$i]);
            $points[] = $x;
            $points[] = $y;
        }
        
        return $points;
    }
    
    function getAngles($points) {
        assert(count($points) % 2 === 0);
        $count = count($points) / 2;
        
        $angles = [];
        for($i = 0; $i < $count; ++$i) {
            $prevX = $points[($i - 1 + $count) % $count * 2    ];
            $prevY = $points[($i - 1 + $count) % $count * 2 + 1];
            $nextX = $points[($i + 1) % $count * 2    ];
            $nextY = $points[($i + 1) % $count * 2 + 1];
            
            $angles[] = atan2($nextY - $prevY, $nextX - $prevX);
        }
        
        return $angles;
    }
    
    function lerp($start, $end, $ratio) {
        return $start + $ratio * ($end - $start);
    }