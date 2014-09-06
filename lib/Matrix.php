<?php
	// Copyright (C) 2013-2014 Vladimir P.
	
	final class Matrix {
		private $a;
		private $b;
		private $c;
		private $d;
		private $tx;
		private $ty;
		
		public function __construct($a = 1, $b = 0, $c = 0, $d = 1, $tx = 0, $ty = 0) {
			$this->setA($a);
			$this->setB($b);
			$this->setC($c);
			$this->setD($d);
			$this->setTX($tx);
			$this->setTY($ty);
		}
		
		/**
		 * Applies translation to the matrix.
		 *
		 * @param float $tx
		 * @param float $ty
		 * @return void
		 */
		public function translate($tx, $ty) {
			$this->tx += $tx;
			$this->ty += $ty;
		}
		
		/**
		 * Applies scaling transformation to the matrix.
		 *
		 * @param float $sx
		 * @param float $sy
		 * @return void
		 */
		public function scale($sx, $sy) {
			$scaleMatrix = new Matrix($sx, 0, 0, $sy, 0, 0);
			$this->multiply($scaleMatrix);
		}
		
		/**
		 * Applies rotation transformation to the matrix.
		 *
		 * @param float $q Angle in radians.
		 * @return void
		 */
		public function rotate($q) {
			$rotationMatrix = new Matrix(cos($q), sin($q), -sin($q), cos($q), 0, 0);
			$this->multiply($rotationMatrix);
		}
		
		/**
		 * Applies skew transformation to the matrix.
		 *
		 * @param float $skewx Skew angle along the x-axis in radians.
		 * @param float $skewy Skew angle along the y-axis in radians.
		 * @return void
		 */
		public function skew($skewx, $skewy) {
			$skewMatrix = new Matrix(1, tan($skewy), tan($skewx), 1, 0, 0);
			$this->multiply($skewMatrix);
		}
		
		/**
		 * Multiplies matrix by another matrix.
		 * 
		 * | A  C  Tx |   | A'  C'  Tx' |   | A"  C"  Tx" |
		 * | B  D  Ty | x | B'  D'  Ty' | = | B"  D"  Ty" |
		 * | 0  0  1  |   | 0   0   1   |   | 0   0   1   |
		 *
		 * @param Matrix $matrix
		 * @return void
		 */
		public function multiply($matrix) {
			$newA = $this->a * $matrix->getA() + $this->c * $matrix->getB();
			$newB = $this->b * $matrix->getA() + $this->d * $matrix->getB();
			$newC = $this->a * $matrix->getC() + $this->c * $matrix->getD();
			$newD = $this->b * $matrix->getC() + $this->d * $matrix->getD();
			$newTX = $this->a * $matrix->getTX() + $this->c * $matrix->getTY() + $this->tx;
			$newTY = $this->b * $matrix->getTX() + $this->d * $matrix->getTY() + $this->ty;
			$this->__construct($newA, $newB, $newC, $newD, $newTX, $newTY);
		}
		
		/**
		 * Applies matrix to the point.
		 * 
		 * | A  C  Tx |   | X |   | X' |
		 * | B  D  Ty | x | Y | = | Y' |
		 * | 0  0  1  |   | 1 |   | 1  |
		 *
		 * @param float $x
		 * @param float $y
		 * @return array
		 */
		public function apply($x, $y) {
			return array($this->a * $x + $this->c * $y + $this->tx,
			             $this->b * $x + $this->d * $y + $this->ty);
		}
		
		/**
		 * Converts matrix to an SVG transform.
		 *
		 * @return string
		 */
		public function exportToSVGTransform() {
			return "matrix({$this->a},{$this->b},{$this->c},{$this->d},{$this->tx},{$this->ty})";
		}
		
		public function setA($a) {
			$this->a = (float)$a;
		}
		
		public function getA() {
			return $this->a;
		}
		
		public function setB($b) {
			$this->b = (float)$b;
		}
		
		public function getB() {
			return $this->b;
		}
		
		public function setC($c) {
			$this->c = (float)$c;
		}
		
		public function getC() {
			return $this->c;
		}
		
		public function setD($d) {
			$this->d = (float)$d;
		}
		
		public function getD() {
			return $this->d;
		}
		
		public function setTX($tx) {
			$this->tx = (float)$tx;
		}
		
		public function getTX() {
			return $this->tx;
		}
		
		public function setTY($ty) {
			$this->ty = (float)$ty;
		}
		
		public function getTY() {
			return $this->ty;
		}
	}