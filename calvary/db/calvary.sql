-- dbcalvary.attendance definition

CREATE TABLE `attendance` (
  `no` int(11) NOT NULL AUTO_INCREMENT,
  `student_no` int(11) NOT NULL,
  `date_no` int(11) NOT NULL DEFAULT '0',
  `score` json NOT NULL,
  PRIMARY KEY (`no`),
  UNIQUE KEY `students_no_date_no` (`student_no`,`date_no`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=12318 DEFAULT CHARSET=euckr;


-- dbcalvary.`date` definition

CREATE TABLE `date` (
  `no` int(11) NOT NULL AUTO_INCREMENT,
  `date` varchar(50) DEFAULT NULL,
  `year` varchar(50) DEFAULT NULL,
  `month` varchar(50) DEFAULT NULL,
  `day` varchar(50) DEFAULT NULL,
  `score` json DEFAULT NULL,
  PRIMARY KEY (`no`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=euckr;


-- dbcalvary.scoreTabel definition

CREATE TABLE `scoreTabel` (
  `no` int(11) NOT NULL AUTO_INCREMENT,
  `table` json DEFAULT NULL,
  PRIMARY KEY (`no`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COMMENT='점수판';


-- dbcalvary.students definition

CREATE TABLE `students` (
  `no` int(11) NOT NULL AUTO_INCREMENT,
  `part` varchar(50) DEFAULT NULL,
  `grade` varchar(50) DEFAULT NULL,
  `class` varchar(50) DEFAULT NULL,
  `name` varchar(50) CHARACTER SET euckr COLLATE euckr_korean_ci DEFAULT NULL,
  `birth` varchar(50) DEFAULT NULL,
  `address` varchar(200) CHARACTER SET euckr COLLATE euckr_korean_ci DEFAULT NULL,
  `phone1` varchar(50) CHARACTER SET euckr COLLATE euckr_korean_ci DEFAULT NULL,
  `phone2` varchar(50) CHARACTER SET euckr COLLATE euckr_korean_ci DEFAULT NULL,
  `gender` enum('남','여') DEFAULT NULL,
  `is_show` enum('Y','N') CHARACTER SET euckr COLLATE euckr_korean_ci DEFAULT NULL,
  PRIMARY KEY (`no`)
) ENGINE=InnoDB AUTO_INCREMENT=189 DEFAULT CHARSET=euckr;


-- dbcalvary.teacher definition

CREATE TABLE `teacher` (
  `no` int(11) NOT NULL AUTO_INCREMENT,
  `part` varchar(50) NOT NULL DEFAULT '0',
  `name` varchar(50) NOT NULL DEFAULT '0',
  `gender` enum('남','여') NOT NULL,
  `birth` varchar(50) NOT NULL DEFAULT '',
  `cellphone` varchar(50) NOT NULL DEFAULT '0',
  `address` varchar(200) NOT NULL DEFAULT '0',
  `diocese` varchar(50) NOT NULL DEFAULT '0' COMMENT '교구',
  `area` varchar(50) NOT NULL DEFAULT '0' COMMENT '구역',
  `duty` varchar(50) NOT NULL DEFAULT '0' COMMENT '직분',
  `team` varchar(50) NOT NULL DEFAULT '0' COMMENT '팀',
  PRIMARY KEY (`no`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8;
