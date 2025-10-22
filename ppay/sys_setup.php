<?php
if(!$config||!$tmweasy_user){
	if(!$thismain){
		die("เปิดรัน url ที่ไฟล์ index.php ครับ");
	}
	echo '
	<!DOCTYPE html>
<html lang="en" >
<head>
<meta charset="UTF-8">
</head>
<body>
	<h1>พร้อมเพย์ QR Setup..</h1>';
	//$createconfig=@file_put_contents("config.php"," ");
	$cwd = getcwd();
	if(!is_writable($cwd)){
		echo "<h2 style='color:red'>chmod 777 กรุณาเพิ่มสิทธิ  การเขียน ใน Folder ก่อน</h2>";
	}else{
		if($_POST["tmweasyuser"]&&$_POST["tmweasypass"]){
			$chuser=$check_api=connect_api("http://tmwallet.thaighost.net/apiwallet.php?username=".$_POST["tmweasyuser"]."&password=".$_POST["tmweasypass"]."&json=1");
			$check_api=json_decode($check_api,true);
			if($check_api['Status']!="ready"){
				echo "<h2 style='color:red'>".$check_api['Msg']." : ตรวจสอบความถูกต้องของข้อมูล </h2>";
			}else{
				$_SESSION["tmweasyuser"]=$_POST["tmweasyuser"];
				$_SESSION["tmweasypass"]=$_POST["tmweasypass"];
				header( "location:index.php?setup=2" );
			}
		}
		if(is_numeric($_POST['account_no'])&&is_numeric($_POST['pp_no'])){
			$_SESSION["account_no"]=$_POST["account_no"];
			$_SESSION["bank_name"]=$_POST["bank_name"];
			$_SESSION["pp_no"]=$_POST["pp_no"];
			$_SESSION["pp_type"]=$_POST["pp_type"];
			$_SESSION["conid"]=$_POST["conid"];
			$_SESSION["accode"]=$_POST["accode"];
			$_SESSION["money_input"]=$_POST["money_input"];
			$_SESSION["money_list"]=$_POST["money_list"];
			
			header( "location:index.php?setup=3" );
		}
		if($_POST['setdb']=="true"){
			header( "location:index.php?setup=4" );
		}else if($_POST['setdb']=="false"){
			$config_data='
<?php
	$api_url="http://tmwallet.thaighost.net/apipp.php";
	$tmweasy_user="'.$_SESSION["tmweasyuser"].'";
	$tmweasy_password="'.$_SESSION["tmweasypass"].'";

	$con_id="'.$_SESSION["conid"].'"; //conid ที่ได้จากการเปิดใช้งาน Qr Promptpay Api บนเว็บ  tmweasy
	$bbl_accode="'.$_SESSION["accode"].'";//accode จากการเข้ารหัส id และ รหัสผ่านธนาคาร ที่  https://www.tmweasy.com/encode.php 
	$bbl_account_no="'.$_SESSION["account_no"].'";//เลขบัญชีธนาคารกรุงเทพ หรือ กสิกร  ใส่เฉพาะตัวเลข
	$prommpay_no="'.$_SESSION["pp_no"].'";	//เลข ID พร้อมเพย์ ใส่เฉพาะตัวเลขเช่น เบอร์โทร เลขบัตร ปชช *กรณีเชื่อมกับกสิกร สามารถนำเลข e-wallet บนแอปกสิกรมาใส่ได้เลย แล้วกำหนด $prommpay_type เป็น 03   วิธีดูเลข E-Wallet บนแอปกสิกร  https://iot.thaighost.net/e_kbank.php
	$prommpay_type="'.$_SESSION["pp_type"].'";//ประเพทพร้อมเพย์  01 = Mobile No., 02 = ID No./Tax No., 03 = E-Wallet No.
	$prommpay_name="'.$_SESSION["bank_name"].'";//ชื่อบัญชี

	$mony_type='.$_SESSION["money_input"].';//0=input , 1 = Select
	$mony_list=array('.$_SESSION["money_list"].');//list ราคาที่ให้เลือกเติมกรณีเลือก $mony_type เป็น 1

	$mul_credit=1;//ตัวคูณเครดิตร กับยอดเงินที่โอนมา

	//--------------- การเชื่อม ฐานข้อมูล เพื่ออัพเดทเครดิตรให้ลูกค้า----------------
	$database_host="";
	$database_user="";
	$database_password="";
	$database_db_name="";
	$database_type="0";//1 = mysql , 2 = mysqli ,3 = mssql (microsoft sql server) , 4 = Odbc for microsoft sql server , 5 = sqlsrv for microsoft sql server

	$database_table="";//ตารางที่เต็มข้อมูลลูกค้า หรือ เก็บข้อมูลเครดิตร
	$database_user_field="";//ฟิวที่ใช้ในการอ้างอิง user เช่น username userid
	$database_point_field="";//ฟิวที่ใช้ในการเก็บค่า พ้อย เครดิตร ที่ต้องการให้อัพเดทหลังเต็มเสร็จ
?>';
				@file_put_contents("config.php",$config_data);
			
				header( "location:index.php");
		}
		if($_POST['setdb_type']){
			$_SESSION["setdb_type"]=$_POST["setdb_type"];
			header( "location:index.php?setup=5" );
		}
		if($_POST['db_server']){
			$database_host=$_POST['db_server'];
			$database_user=$_POST['db_user'];
			$database_password=$_POST['db_pass'];
		
			$connectionInfo = array("UID" => $database_user, "PWD" => $database_password);

			$connect_db=array(
			'1'=>'$conn=mysql_connect($database_host,$database_user,$database_password);',
				
			'2'=>'$conn=mysqli_connect($database_host,$database_user,$database_password);',

			'3'=>'$conn=mssql_connect($database_host,$database_user,$database_password);',
				
			'4'=>'$conn=odbc_connect(\'Driver={SQL Server};Server=\' .$database_host. \';Database=\' . $database_db_name. \';\' ,$database_user, $database_password);',

			'5'=>'$conn=sqlsrv_connect($database_host,$connectionInfo);',
			
			'6'=>'
				try{
					$conn = new PDO("sqlsrv:server=$database_host", $database_user, $database_password);
				}catch (PDOException $e) {
				}
				',

			);
			
			eval($connect_db[$_SESSION["setdb_type"]]);
			if(!$conn){
				echo "<h2 style='color:red'>การเชื่อมต่อฐานข้อมูลไม่ถูกต้อง ตรวจสอบการป้อนข้อมูล</h2>";
			}else{
				$select_db=array(
				'1'=>'$dblist=mysql_query("show databases");',
					
				'2'=>'$dblist=mysqli_query($conn,"show databases");',

				'3'=>'$dblist=mssql_query("SELECT * FROM sys.databases");',
					
				'4'=>'$dblist=odbc_exec($conn,"SELECT * FROM sys.databases");',

				'5'=>'$dblist=sqlsrv_query($conn,"SELECT * FROM sys.databases");',
				'6'=>'
					$res = $conn->prepare("SELECT * FROM sys.databases");
					$res->execute();',

				);
			
			
			eval($select_db[$_SESSION["setdb_type"]]);
			$ii=0;
			
		
			$sql_fetch_array=array(
				'1'=>'while($dbl=mysql_fetch_array($dblist)){
					$dbname_array[$ii]=$dbl["Database"];
					$ii++;
				}',
				'2'=>'while($dbl=mysqli_fetch_array($dblist)){
					$dbname_array[$ii]=$dbl["Database"];
					$ii++;
				}',
				'3'=>'while($dbl=mssql_fetch_array($dblist)){
					$dbname_array[$ii]=$dbl["name"];
					$ii++;
				}',
				'4'=>'while($dbl=odbc_fetch_array($dblist)){
					$dbname_array[$ii]=$dbl["name"];
					$ii++;
				}',
				'5'=>'while($dbl=sqlsrv_fetch_array($dblist)){
					$dbname_array[$ii]=$dbl["name"];
					$ii++;
				}',
				'6'=>'while($dbl = $res->fetch( PDO::FETCH_ASSOC )){
					$dbname_array[$ii]=$dbl["name"];
					$ii++;
				}',
				);
			eval($sql_fetch_array[$_SESSION["setdb_type"]]);
			
			//$_SESSION["conn"]=$conn;
			$_SESSION["db_server"]=$_POST['db_server'];
			$_SESSION["db_user"]=$_POST['db_user'];
			$_SESSION["db_pass"]=$_POST['db_pass'];
			
			unset($_SESSION["dbname_array"]);
			$_SESSION["dbname_array"]=$dbname_array;
		
			header( "location:index.php?setup=6" );
			}
		}
		if($_POST['setdb_db']){
			$database_host=$_SESSION["db_server"];
			$database_user=$_SESSION["db_user"];
			$database_password=$_SESSION["db_pass"];
			$database_db_name=$_POST['setdb_db'];
		
			$connectionInfo = array("Database" => $database_db_name,"UID" => $database_user, "PWD" => $database_password);

			$connect_db=array(
			'1'=>'$conn=mysql_connect($database_host,$database_user,$database_password);
				mysql_select_db($database_db_name);',
				
			'2'=>'$conn=mysqli_connect($database_host,$database_user,$database_password,$database_db_name);',

			'3'=>'$conn=mssql_connect($database_host,$database_user,$database_password);
				mssql_select_db($database_db_name);',
				
			'4'=>'$conn=odbc_connect(\'Driver={SQL Server};Server=\' .$database_host. \';Database=\' . $database_db_name. \';\' ,$database_user, $database_password);',

			'5'=>'$conn=sqlsrv_connect($database_host,$connectionInfo);',
			'6'=>'
				try{
					$conn = new PDO("sqlsrv:server=$database_host;Database=$database_db_name", $database_user, $database_password);
				}catch (PDOException $e) {
				}
				',
			);
			
			eval($connect_db[$_SESSION["setdb_type"]]);
			
			$select_table=array(
				'1'=>'$tblist=mysql_query("show TABLES ");',
					
				'2'=>'$tblist=mysqli_query($conn,"show TABLES ");',

				'3'=>'$tblist=mssql_query("SELECT * FROM sys.tables");',
					
				'4'=>'$tblist=odbc_exec($conn,"SELECT * FROM sys.tables");',

				'5'=>'$tblist=sqlsrv_query($conn,"SELECT * FROM sys.tables");',
				'6'=>'
					$res = $conn->prepare("SELECT * FROM sys.tables");
					$res->execute();',

			);
			eval($select_table[$_SESSION["setdb_type"]]);
			
			$ii=0;
			$sql_fetch_array=array(
				'1'=>'while($dbl=mysql_fetch_array($tblist)){
					$tablename_array[$ii]=$dbl["Tables_in_".$database_db_name];
					$ii++;
				}',
				'2'=>'while($dbl=mysqli_fetch_array($tblist)){
					$tablename_array[$ii]=$dbl["Tables_in_".$database_db_name];
					$ii++;
				}',
				'3'=>'while($dbl=mssql_fetch_array($tblist)){
					$tablename_array[$ii]=$dbl["name"];
					$ii++;
				}',
				'4'=>'while($dbl=odbc_fetch_array($tblist)){
					$tablename_array[$ii]=$dbl["name"];
					$ii++;
				}',
				'5'=>'while($dbl=sqlsrv_fetch_array($tblist)){
					$tablename_array[$ii]=$dbl["name"];
					$ii++;
				}',
				'6'=>'while($dbl = $res->fetch( PDO::FETCH_ASSOC )){
					$tablename_array[$ii]=$dbl["name"];
					$ii++;
				}',
				);
			eval($sql_fetch_array[$_SESSION["setdb_type"]]);
			
			unset($_SESSION["tablename_array"]);
			$_SESSION["tablename_array"]=$tablename_array;
			$_SESSION['setdb_db']=$_POST['setdb_db'];
			//$_SESSION["conn"]=$conn;
			header( "location:index.php?setup=7" );
			
		}
		
		if($_POST['set_tb']){
			$database_host=$_SESSION["db_server"];
			$database_user=$_SESSION["db_user"];
			$database_password=$_SESSION["db_pass"];
			$database_db_name=$_SESSION['setdb_db'];
			
			$set_tb=$_POST['set_tb'];
		
			$connectionInfo = array("Database" => $database_db_name,"UID" => $database_user, "PWD" => $database_password);

			$connect_db=array(
			'1'=>'$conn=mysql_connect($database_host,$database_user,$database_password);
				mysql_select_db($database_db_name);',
				
			'2'=>'$conn=mysqli_connect($database_host,$database_user,$database_password,$database_db_name);',

			'3'=>'$conn=mssql_connect($database_host,$database_user,$database_password);
				mssql_select_db($database_db_name);',
				
			'4'=>'$conn=odbc_connect(\'Driver={SQL Server};Server=\' .$database_host. \';Database=\' . $database_db_name. \';\' ,$database_user, $database_password);',

			'5'=>'$conn=sqlsrv_connect($database_host,$connectionInfo);',
			'6'=>'
				try{
					$conn = new PDO("sqlsrv:server=$database_host;Database=$database_db_name", $database_user, $database_password);
				}catch (PDOException $e) {
				}
				',

			);
			
			eval($connect_db[$_SESSION["setdb_type"]]);
			
			$select_fd=array(
				'1'=>'$fdlist=mysql_query("SHOW COLUMNS FROM $set_tb");',
					
				'2'=>'$fdlist=mysqli_query($conn,"SHOW COLUMNS FROM $set_tb");',

				'3'=>'$fdlist=mssql_query("select COLUMN_NAME from INFORMATION_SCHEMA.COLUMNS where TABLE_NAME=\'$set_tb\'");',
					
				'4'=>'$fdlist=odbc_exec($conn,"select COLUMN_NAME from INFORMATION_SCHEMA.COLUMNS where TABLE_NAME=\'$set_tb\'");',

				'5'=>'$fdlist=sqlsrv_query($conn,"select COLUMN_NAME from INFORMATION_SCHEMA.COLUMNS where TABLE_NAME=\'$set_tb\'");',
				'6'=>'
					$res = $conn->prepare("select COLUMN_NAME from INFORMATION_SCHEMA.COLUMNS where TABLE_NAME=\'$set_tb\'");
					$res->execute();',

			);
			eval($select_fd[$_SESSION["setdb_type"]]);
			
			$ii=0;
			$sql_fetch_array=array(
				'1'=>'while($dbl=mysql_fetch_array($fdlist)){
					$fdname_array[$ii]=$dbl["Field"];
					$ii++;
				}',
				'2'=>'while($dbl=mysqli_fetch_array($fdlist)){
					$fdname_array[$ii]=$dbl["Field"];
					$ii++;
				}',
				'3'=>'while($dbl=mssql_fetch_array($fdlist)){
					$fdname_array[$ii]=$dbl["COLUMN_NAME"];
					$ii++;
				}',
				'4'=>'while($dbl=odbc_fetch_array($fdlist)){
					$fdname_array[$ii]=$dbl["COLUMN_NAME"];
					$ii++;
				}',
				'5'=>'while($dbl=sqlsrv_fetch_array($fdlist)){
					$fdname_array[$ii]=$dbl["COLUMN_NAME"];
					$ii++;
				}',
				'6'=>'while($dbl = $res->fetch( PDO::FETCH_ASSOC )){
					$fdname_array[$ii]=$dbl["COLUMN_NAME"];
					$ii++;
				}',
				);
			eval($sql_fetch_array[$_SESSION["setdb_type"]]);
			unset($_SESSION["fdname_array"]);
			$_SESSION["fdname_array"]=$fdname_array;
			$_SESSION['set_tb']=$_POST['set_tb'];
			header( "location:index.php?setup=8" );
			
		}
		if($_POST['set_fd_user']){
			$_SESSION['set_fd_user']=$_POST['set_fd_user'];
			header( "location:index.php?setup=9" );
		}
		if($_POST['set_fd_point']){
			$_SESSION['set_fd_point']=$_POST['set_fd_point'];
			header( "location:index.php?setup=10" );
		}
		if($_POST['mul']){
			$config_data='
			<?php
	$api_url="http://tmwallet.thaighost.net/apipp.php";
	$tmweasy_user="'.$_SESSION["tmweasyuser"].'";
	$tmweasy_password="'.$_SESSION["tmweasypass"].'";

	$con_id="'.$_SESSION["conid"].'"; //conid ที่ได้จากการเปิดใช้งาน Qr Promptpay Api บนเว็บ  tmweasy
	$bbl_accode="'.$_SESSION["accode"].'";//accode จากการเข้ารหัส id และ รหัสผ่านธนาคาร ที่  https://www.tmweasy.com/encode.php ถ้าใช้ผ่าน Line connect ปล่อยว่างได้เลย 
	$bbl_account_no="'.$_SESSION["account_no"].'";//เลขบัญชีธนาคารกรุงเทพ หรือ กสิกร  ใส่เฉพาะตัวเลข
	$prommpay_no="'.$_SESSION["pp_no"].'";	//เลข ID พร้อมเพย์ ใส่เฉพาะตัวเลขเช่น เบอร์โทร เลขบัตร ปชช *กรณีเชื่อมกับกสิกร สามารถนำเลข e-wallet บนแอปกสิกรมาใส่ได้เลย แล้วกำหนด $prommpay_type เป็น 03   วิธีดูเลข E-Wallet บนแอปกสิกร  https://iot.thaighost.net/e_kbank.php
	$prommpay_type="'.$_SESSION["pp_type"].'";//ประเพทพร้อมเพย์  01 = Mobile No., 02 = ID No./Tax No., 03 = E-Wallet No.
	$prommpay_name="'.$_SESSION["bank_name"].'";//ชื่อบัญชี

	$mony_type='.$_SESSION["money_input"].';//0=input , 1 = Select
	$mony_list=array('.$_SESSION["money_list"].');//list ราคาที่ให้เลือกเติมกรณีเลือก $mony_type เป็น 1

	$mul_credit='.$_POST["mul"].';//ตัวคูณเครดิตร กับยอดเงินที่โอนมา

	//--------------- การเชื่อม ฐานข้อมูล เพื่ออัพเดทเครดิตรให้ลูกค้า----------------
	$database_host="'.$_SESSION["db_server"].'";
	$database_user="'.$_SESSION["db_user"].'";
	$database_password="'.$_SESSION["db_pass"].'";
	$database_db_name="'.$_SESSION['setdb_db'].'";
	$database_type="'.$_SESSION["setdb_type"].'";//1 = mysql , 2 = mysqli ,3 = mssql (microsoft sql server) , 4 = Odbc for microsoft sql server , 5 = sqlsrv for microsoft sql server , 6 = pdo_sqlsrv  for microsoft sql server

	$database_table="'.$_SESSION['set_tb'].'";//ตารางที่เต็มข้อมูลลูกค้า หรือ เก็บข้อมูลเครดิตร
	$database_user_field="'.$_SESSION['set_fd_user'].'";//ฟิวที่ใช้ในการอ้างอิง user เช่น username userid
	$database_point_field="'.$_SESSION['set_fd_point'].'";//ฟิวที่ใช้ในการเก็บค่า พ้อย เครดิตร ที่ต้องการให้อัพเดทหลังเต็มเสร็จ
?>';
			@file_put_contents("config.php",$config_data);
			
			$_SESSION["alert_content"]="Setup เรียบร้อย หากต้องการแก้ไขค่าต่างๆ สามารถทำได้ที่ไฟล์ config.php หากต้องการตั้งค่าใหม่ให้ลบไฟล์ config.php";
			$_SESSION["alert_type"]="alert-success";
			header( "location:index.php" );
			die();
		}
		switch($_GET['setup']){
			case 2:
			?>
				<form method="post">
					<p>เลขบัญชี ธนาคาร :  <input name="account_no" maxlength="10"> ใส่เฉพาะตัวเลข * รองรับ กสิกร กับกรุงเทพ</p>
					<p>ชื่อบัญชี  :  <input name="bank_name"></p>
					<p>เลขพร้อมเพย์  :  <input name="pp_no"> เช่น เบอร์โทร ,บัตรปชช ,เลข E-wallet กสิกร <a href="https://tmweasy.tk/e_kbank.php" target="_bank">*วิธีดูเลข E-wallet</a></p>
					<p>ประเภทพร้อมเพย์ :  <select name="pp_type"><option value="01">เบอร์โทร</option> <option value="02">เลขบัตร ปชช</option> <option value="03">กสิกร E-wallet</option></select> *เลือกชนิดพร้อมเพย์ให้ถูกต้อง ถ้าผิดจะแสกน Qr ไม่ได้</p>
					<p>Con id  :  <input name="conid"> เลข ID ที่ได้จากการเปิดใช้งาน Qr Promptpay Api บนเว็บ  tmweasy</p>
					<p>Accode :  <input name="accode"> จากการเข้ารหัส User และ รหัสผ่าน ธนาคาร ที่  <a href="https://tmweasy.tk/encode.php" target="_bank">https://www.tmweasy.com/encode.php</a></p>
					
					<div><b>รูปแบบการป้อนยอดโอน</b></div>
					<p><label ><input type="radio" name="money_input" value="0" checked> ลูกค้าระบุยอดเอง</label></p>
					<p><label ><input type="radio" name="money_input" value="1"> แบบ List ยอด ยอดที่กำหนด <input size="40" name="money_list" value="50,80,100,150,300,500"> </label></p>
					<p><input type="submit" value="Next"></p>
				</form>
				
			<?php
			break;
			case 3:
			?>
				<h2>ตั้งค่า ฐานข้อมูล เพื่ออัพเดท ยอดเครดิตร - พ้อย ให้ลูกค้าหลังเติม</h2>
				<form method="post">
					<p>
						<div><label><input type="radio" name="setdb" value="true" checked> ตั้งค่า ฐานข้อมูลต่อไป </label></div>
						<div><label><input type="radio" name="setdb" value="false" > ไม่ต้อง ฉันต้องการพัฒนาส่วนนี้เอง</label></div>
					</p>
					<p><input type="submit" value="Next"></p>
				</form>
				<p><a href="index.php?setup=2">ย้อนกลับ</a></p>
			<?php
			break;
			case 4:
			?>
				<h2>ตั้งค่า ฐานข้อมูล เพื่ออัพเดท ยอดเครดิตร - พ้อย ให้ลูกค้าหลังเติม</h2>
				<form method="post">
					<div><b>เลือกชนิดการเชื่อมต่อ ฐานข้อมูล</b></div>
					<p>
					<?php
					
						if(function_exists("mysql_connect")){
							echo '<div><label><input type="radio" name="setdb_type" value="1" > mysql *สำหรับ  Mysql , MariaDB Php รุ่นเก่า</label></div>';
						}
						if(function_exists("mysqli_connect")){
							echo '<div><label><input type="radio" name="setdb_type" value="2" > mysqli *สำหรับ  Mysql , MariaDB</label></div>';
						}
						if(function_exists("mssql_connect")){
							echo '<div><label><input type="radio" name="setdb_type" value="3" > mssql *สำหรับ  Microsoft SQL Server php รุ่นเก่า</label></div>';
						}
						if(function_exists("odbc_connect")){
							echo '<div><label><input type="radio" name="setdb_type" value="4" > odbc *สำหรับ  Microsoft SQL Server</label></div>';
						}
						if(function_exists("sqlsrv_connect")){
							echo '<div><label><input type="radio" name="setdb_type" value="5" > sqlsrv *สำหรับ  Microsoft SQL Server php v. 5-8</label></div>';
						}
						
						if(class_exists("PDO")){
							if(in_array("sqlsrv",PDO::getAvailableDrivers())){
								echo '<div><label><input type="radio" name="setdb_type" value="6" > pdo_sqlsrv *สำหรับ  Microsoft SQL Server php v. 5-8</label></div>';
					
							}
						}
						
						
						
					?>
						
					</p>

					<p><input type="submit" value="Next"></p>
				</form>
				<p><a href="index.php?setup=3">ย้อนกลับ</a></p>
			<?php
			break;
			case 5:
			?>
				<h2>ตั้งค่า ฐานข้อมูล เพื่ออัพเดท ยอดเครดิตร - พ้อย ให้ลูกค้าหลังเติม</h2>
				<form method="post">
					<p>Database Server : <input name="db_server"> เช่น Localhost , ip</p>
					<p>Database User : <input name="db_user"> เช่น root , sa</p>
					<p>Database Password : <input name="db_pass"></p>
					
					<p><input type="submit" value="Next"></p>
				</form>
				<p><a href="index.php?setup=4">ย้อนกลับ</a></p>
			<?php
			break;
			case 6:
			?>
				<h2>ตั้งค่า ฐานข้อมูล เพื่ออัพเดท ยอดเครดิตร - พ้อย ให้ลูกค้าหลังเติม</h2>
				<form method="post">
					<div><b>เลือกฐานข้อมูล ที่ต้องการ</b></div>
					<p>
					<?php
				
					foreach($_SESSION["dbname_array"] as $dbname){
						echo '<div><label><input type="radio" name="setdb_db" value="'.$dbname.'" > '.$dbname.'</label></div>';
					}
					?>
					</p>
					<p><input type="submit" value="Next"></p>
				</form>
				<p><a href="index.php?setup=5">ย้อนกลับ</a></p>
			<?php
			break;
			case 7:
			?>
				<h2>ตั้งค่า ฐานข้อมูล เพื่ออัพเดท ยอดเครดิตร - พ้อย ให้ลูกค้าหลังเติม</h2>
				<form method="post">
					<div><b>เลือกตารางข้อมูล ที่เก็บเครดิตรลูกค้า เช่นตาราง User</b></div>
					<p>
					<?php
					foreach($_SESSION["tablename_array"] as $tbname){
						echo '<div><label><input type="radio" name="set_tb" value="'.$tbname.'" > '.$tbname.'</label></div>';
					}
					?>
					</p>
					<p><input type="submit" value="Next"></p>
				</form>
				<p><a href="index.php?setup=6">ย้อนกลับ</a></p>
			<?php
			break;
			case 8:
			?>
				<h2>ตั้งค่า ฐานข้อมูล เพื่ออัพเดท ยอดเครดิตร - พ้อย ให้ลูกค้าหลังเติม</h2>
				<form method="post">
					<div><b>เลือกฟิวด์ ที่ใช้อ้างอิง ID ลูกค้า เช่น username uid email เป็นคอลั่มข้อมูลที่ใช้เทียบ Ref1</b></div>
					<p>
					<?php
					foreach($_SESSION["fdname_array"] as $fdname){
						echo '<div><label><input type="radio" name="set_fd_user" value="'.$fdname.'" > '.$fdname.'</label></div>';
					}
					?>
					</p>
					<p><input type="submit" value="Next"></p>
				</form>
				<p><a href="index.php?setup=7">ย้อนกลับ</a></p>
			<?php
			break;
			case 9:
			?>
				<h2>ตั้งค่า ฐานข้อมูล เพื่ออัพเดท ยอดเครดิตร - พ้อย ให้ลูกค้าหลังเติม</h2>
				<form method="post">
					<div><b>เลือกฟิวด์ ที่ต้องการให้อัพเดท เครดิตร  - พ้อย </b></div>
					<p>
					<?php
					foreach($_SESSION["fdname_array"] as $fdname){
						if($_SESSION['set_fd_user']!=$fdname){
							echo '<div><label><input type="radio" name="set_fd_point" value="'.$fdname.'" > '.$fdname.'</label></div>';
						}
					}
					?>
					</p>
					<p><input type="submit" value="Next"></p>
				</form>
				<p><a href="index.php?setup=8">ย้อนกลับ</a></p>
			<?php
			break;
			case 10:
			?>
				<h2>ตั้งค่า เรทพ้อย</h2>
				<form method="post">
					<div><b>เพิ่มพ้อยหรือเครดิตรต่างๆ เมื่อเติมสำเร็จ </b></div>
					<p>
						<p>ตัวคูณยอด : <input type ="number" name="mul" value="1"> เช่นเติม 50 จะได้ 50 พ้อย ก็ใส่ค่าเป็น 1</p>
					</p>
				
					
					<p><input type="submit" value="Next"></p>
				</form>
				<p><a href="index.php?setup=9">ย้อนกลับ</a></p>
			<?php
			break;
			default:
	?>
				<form method="post">
					<p>User Tmweasy : <input name="tmweasyuser"></p>
					<p>Password Tmweasy : <input name="tmweasypass"></p>
					<p><input type="submit" value="Next"></p>
				</form>
				
	<?php
		}
	}
	echo '
	<p>หากต้องการระบบที่นอกเหนือจากตัวพื้นฐานนี้ สามารถติดแอดมินเพื่อพัฒนาเพิ่มเติมได้</p>
</body>
</html>';
	die();
}

?>