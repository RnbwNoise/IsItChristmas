<?php
    require_once('lib/ImageAffineMatrix.php');
    
    
    define('IMAGE_WIDTH',  800);
    define('IMAGE_HEIGHT', 600);
    
    define('FLAG_WIDTH',  40);
    define('FLAG_HEIGHT', 30);
    
    
    // Heart
    $points = getPoints(function($t) {
        $scale = 100;
        $t *= 2*M_PI;
        // Madeloid formula is from http://johnthemathguy.blogspot.com/2013/02/the-function-of-heart.html
        $n = M_PI - abs(M_PI - $t);
        $p = 2.0 * (1 - $n / M_PI) + 0.3 * $n * (M_PI - $n) + 0.6 * $n * (M_PI - $n) * ($n - M_PI / 2);
        return [ -$p * sin($t) * $scale, $p * cos($t) * $scale ];
    }, 50, 100);
    $angles = getAngles($points);
    
    /*
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
    $angles = getAngles($points);
    
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
    $angles = getAngles($points);
    */
    
    header('Content-type: image/png');
    imagePNG(makeCurvePreviewImage($points, $angles));
    
    
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
    
    
    function makeCurvePreviewImage($points, $angles, $debug = true) {
        assert(count($points) % 2 === 0);
        $count = count($points) / 2;
        assert($count === count($angles));
        
        $image = imageCreateTrueColor(IMAGE_WIDTH, IMAGE_HEIGHT);
        imageFilledRectangle($image, 0, 0, IMAGE_WIDTH - 1, IMAGE_HEIGHT - 1, 0xFFFFFF);
        
        imageLine($image, IMAGE_WIDTH * (3/8), IMAGE_HEIGHT / 2,
                  IMAGE_WIDTH * (5/8), IMAGE_HEIGHT / 2, 0xDDDDDD);
        imageLine($image, IMAGE_WIDTH / 2, IMAGE_HEIGHT * (3/8),
                  IMAGE_WIDTH / 2, IMAGE_HEIGHT * (5/8), 0xDDDDDD);
        
        $centerX = IMAGE_WIDTH / 2;
        $centerY = IMAGE_HEIGHT / 2;
        for($i = 0; $i < $count; ++$i) {
            $currX = $points[$i * 2    ] + $centerX;
            $currY = $points[$i * 2 + 1] + $centerY;
            $nextX = $points[($i + 1) % $count * 2    ] + $centerX;
            $nextY = $points[($i + 1) % $count * 2 + 1] + $centerY;
            
            if($debug) {
                imageLine($image, $currX, $currY, $nextX, $nextY, 0xFF0000);
                imageFilledRectangle($image, $currX - 2, $currY - 2, $currX + 2, $currY + 2, 0xFF0000);
                
                imageLine($image, $currX, $currY,
                          $currX + 20 * cos($angles[$i]),
                          $currY + 20 * sin($angles[$i]),
                          0x0000FF);
            }
            
            $m = (new ImageAffineMatrix())->translate($currX, $currY)->rotate($angles[$i]);
            $flag = [];
            $flag = array_merge($flag, $m->transformPoint(-FLAG_WIDTH / 2, -FLAG_HEIGHT / 2));
            $flag = array_merge($flag, $m->transformPoint(-FLAG_WIDTH / 2,  FLAG_HEIGHT / 2));
            $flag = array_merge($flag, $m->transformPoint( FLAG_WIDTH / 2,  FLAG_HEIGHT / 2));
            $flag = array_merge($flag, $m->transformPoint( FLAG_WIDTH / 2, -FLAG_HEIGHT / 2));
            imageFilledPolygon($image, $flag, count($flag) / 2,
                               imageColorResolveAlpha($image, 200, 200, 200, 92));
        }
        
        $label = $count . ' points';
        $labelWidth = imageFontWidth(5) * strlen($label);
        imageString($image, 5, IMAGE_WIDTH - 1 - $labelWidth, IMAGE_HEIGHT - 1 - imageFontHeight(5),
                    $label, 0xFF0000);
        
        return $image;
    }
    
    
    function lerp($start, $end, $ratio) {
        return $start + $ratio * ($end - $start);
    }