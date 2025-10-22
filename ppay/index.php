<?php
ob_start();
session_start();
set_time_limit(0);
error_reporting(0);
include("function.php");

$config=@include("config.php");
$thismain=true;
include("sys_setup.php");

$database_check=array("1"=>"mysql_connect",
"2"=>"mysqli_connect",
"3"=>"mssql_connect",
"4"=>"odbc_connect",
"5"=>"sqlsrv_connect");

if(!function_exists($database_check[$database_type])){
	//die ('<h1>PHP ของคุณไม่รองรับ การเชื่อมฐานข้อมูลแบบ '.$database_check[$database_type].' ต้องเปิดส่วนเสริมของ PHP ให้รองรับ หรือเปลี่ยนการเชื่อมต่อแบบอื่น ที่ไฟล์ Config.php ตัวแปล $database_type </h1>');
}
$connectionInfo = array("Database" => $database_db_name, "UID" => $database_user, "PWD" => $database_password);
$connect_db=array(
'1'=>'$conn=mysql_connect($database_host,$database_user,$database_password) or die("connect Mysql database error!");
	mysql_select_db($database_db_name) or die("Select database error!");',
	
'2'=>'$conn=mysqli_connect($database_host,$database_user,$database_password,$database_db_name) or die("Error Mysqli Database is not connect!");',

'3'=>'mssql_connect($database_host,$database_user,$database_password) or die("Mssql Database not Connect.. Please Check config");
	mssql_select_db ($database_db_name) or die("Mssql Select database error!");',

'4'=>'$conn=odbc_connect(\'Driver={SQL Server};Server=\' .$database_host. \';Database=\' . $database_db_name. \';\' ,$database_user, $database_password) or die(\'Error Odbc Mssql Database is not connect!\');',
'5'=>'$conn=sqlsrv_connect($database_host,$connectionInfo) or die("sqlsrv_connect to Mssql server Error ตรวจสอบการตั้งค่า Database");',
'6'=>'
	try{
		$conn = new PDO("sqlsrv:server=$database_host;Database=$database_db_name", $database_user, $database_password);
	}catch (PDOException $e) {
		die(\'Error PDO Sqlsrv Database is not connect!\');
	}
				',
);


eval($connect_db[$database_type]);


if($_GET["action"]=="cancel"){
	$connect_api=connect_api($api_url."?username=$tmweasy_user&password=$tmweasy_password&con_id=$con_id&method=cancel&id_pay=".$_SESSION["id_pay"]);
	$_SESSION["id_pay"]="";
	header( "location:index.php" );
	die();
}
if($_GET["action"]=="exit"){
	$_SESSION["id_pay"]="";
	header( "location:index.php" );
	die();
}
if($_GET["action"]=="confirm"){
	$connect_api=connect_api($api_url."?username=$tmweasy_user&password=$tmweasy_password&con_id=$con_id&method=confirm&id_pay=".$_SESSION["id_pay"]."&accode=$bbl_accode&account_no=$bbl_account_no&ip=".my_ip());
	$connect_api=json_decode($connect_api,true);
	
	//for test pay
	/*
	$connect_api["status"]=1;
	$connect_api["amount"]=50;
	$connect_api["ref1"]="test";
	*/
	
	
	if($connect_api["status"]!="1"){
		
		$_SESSION["alert_content"]="Error : ".$connect_api["msg"];
		$_SESSION["alert_type"]="alert-danger";
		header( "location:index.php" );
		die();
	}else{//เมื่อโอนสำเร็จ----------------------------------
	//-----------------------------------------------------------------------------------------------------------------
		$point=$connect_api["amount"]*$mul_credit;
		$ref1=$connect_api["ref1"];
		$database_update=array(
			'1'=>'mysql_query("update $database_table set $database_point_field = $database_point_field + $point where $database_user_field = \'$ref1\' ");',
			'2'=>'mysqli_query($conn,"update $database_table set $database_point_field = $database_point_field + $point where $database_user_field = \'$ref1\' ");',
			'3'=>'mssql_query("update $database_table set $database_point_field = $database_point_field + $point where $database_user_field = \'$ref1\' ");',
			'4'=>'odbc_exec($conn,"update $database_table set $database_point_field = $database_point_field + $point where $database_user_field = \'$ref1\' ");',
			'5'=>'sqlsrv_query($conn,"update $database_table set $database_point_field = $database_point_field + $point where $database_user_field = \'$ref1\' ");',
			'6'=>'$res = $conn->prepare("update $database_table set $database_point_field = $database_point_field + $point where $database_user_field = \'$ref1\' ");
				$res->execute();',
		);
		eval($database_update[$database_type]);
		
		$_SESSION["id_pay"]="";
		$_SESSION["alert_content"]="การโอนเงิน สำเร็จแล้ว   คุณได้รับ ".$point." เครดิตร ขอบคุณครับ";
		$_SESSION["alert_type"]="alert-success";
		header( "location:index.php?action=success" );
		die();
	//-----------------------------------------------------------------------------------------------------------------
	}
	
}

if($_POST["amount"]){
	// แปลงจากบาทเป็นสตางค์ (คูณ 100) สำหรับ TMWEasy API
	$amount_in_satang = intval(floatval($_POST["amount"]) * 100);
	
	$connect_api=connect_api($api_url."?username=$tmweasy_user&password=$tmweasy_password&amount=".$amount_in_satang."&ref1=".$_POST["ref1"]."&con_id=$con_id&method=create_pay");
	$connect_api=json_decode($connect_api,true);
	if($connect_api["status"]!="1"){
		
		$_SESSION["alert_content"]="Error : ".$connect_api["msg"];
		$_SESSION["alert_type"]="alert-danger";
		header( "location:index.php" );
		die();
	}else{
		$_SESSION["id_pay"]=$connect_api["id_pay"];
		header( "location:index.php" );
		die();
	}	
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <!-- Required meta tags-->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="description" content="Colorlib Templates">
    <meta name="author" content="Colorlib">
    <meta name="keywords" content="Colorlib Templates">

    <!-- Title Page-->
    <title>จ่ายผ่าน พร้อมเพย์ แสกน QR Code</title>

    <!-- Icons font CSS-->
    <link href="vendor/mdi-font/css/material-design-iconic-font.min.css" rel="stylesheet" media="all">
    <link href="vendor/font-awesome-4.7/css/font-awesome.min.css" rel="stylesheet" media="all">
    <!-- Font special for pages-->
    <link href="https://fonts.googleapis.com/css?family=Poppins:100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i,900,900i" rel="stylesheet">

    <!-- Vendor CSS-->
    <link href="vendor/select2/select2.min.css" rel="stylesheet" media="all">
    <link href="vendor/datepicker/daterangepicker.css" rel="stylesheet" media="all">

    <!-- Main CSS-->
    <link href="css/main1.css" rel="stylesheet" media="all">
	<script src="alert_box/sweetalert.min.js"></script>
	<link rel="stylesheet" href="alert_box/sweetalert.css">
	<script>
		
		function time_display(id_tag,time_s){
			min=pad(Math.floor(time_s/60),2,0);
			sec=pad(Math.abs((min*60) - time_s),2,0);
			if(time_s<=0){
				document.getElementById(id_tag).innerHTML="หมดเวลาโอนเงิน <br> <button onclick=\"window.location.href='?action=cancel'\" class='btn btn-default has-spinner btn--radius-2 btn--red' type='submit'>ยกเลิก - เริ่มโอนใหม่</button>";
				document.getElementById("pay1").innerHTML="";
				document.getElementById("pay2").innerHTML="";
				document.getElementById("pay3").innerHTML="";
				document.getElementById("pay4").innerHTML="";
				document.getElementById("pay5").innerHTML="";
				document.getElementById("pay6").innerHTML="";
			}else{
				document.getElementById(id_tag).innerHTML=min+" : "+sec;
			}
			
		}
		
		function time_down(){
			sec_start=sec_start-1;
			time_display("time_count_down",sec_start);
			if(sec_start>0){
				setTimeout(time_down, 1000);
			}
			
			
		}
		function pad(n, width , fill) {
			n = n + '';
			return n.length >= width ? n : new Array(width - n.length + 1).join(fill) + n;
		}
		
	</script>
</head>

<body>
    <div class="page-wrapper bg-gra-02 p-t-30 p-b-100 font-poppins">
        <div class="wrapper wrapper--w680">
            <div class="card card-4" >
			<div style=" background-color:#113566" align="center"><img src="pp.png" width="30%" align="center"> 
			
			<?php
			if($_SESSION["id_pay"]){
				echo '<a href="?action=exit"><img src="close.png" width="50" align="right"></a>';
			}
			
			?></div>
                <div class="card-body">
					
                    <h2 style= "margin-top:-50px">ชำระด้วย PromptPay อัตโนมัติ <br>
					<?php
			
						$support = dir("support_logo");
						while ($file = $support->read()){
							if($file!="."&&$file!=".."){
								echo "<img src='support_logo/$file' height='35'> ";
							}
						  
						}
						$support->close(); 
					?></h2>
					<div class="label" style="color:olive">! ช่วงเวลา 00:00 - 02:00  เป็นช่วงที่ธนาคารปรับปรุงระบบในรอบวัน อาจทำให้ไม่สามารถตรวจสอบการโอนได้  ควรกดตรวจสอบเป็นระยะ</div>
					<?php
					if($_GET["action"]=="success"){
						?>
						<div align="center"><img src="check_green.png" width="30%"></div>
						<h2 class="title" align="center">ทำรายการสำเร็จแล้ว</h2>
						<p class="label" align="center">ตรวจสอบเครดิตรของคุณ หากพบปัญหากรุณาติดต่อ Admin ขอบคุณครับ</p>
						<p class="label" align="center">[ ! ปิดหน้านี้ได้เลยครับ ]</p>
					 <?php
					}else{
					if($_SESSION["id_pay"]){
						$connect_api=connect_api($api_url."?username=$tmweasy_user&password=$tmweasy_password&con_id=$con_id&id_pay=".$_SESSION["id_pay"]."&type=$prommpay_type&promptpay_id=$prommpay_no&method=detail_pay");
						$connect_api=json_decode($connect_api,true);
						if($connect_api["status"]!="1"){
							$_SESSION["id_pay"]="";
							$_SESSION["alert_content"]="Error : ".$connect_api["msg"];
							$_SESSION["alert_type"]="alert-danger";
							header( "location:index.php" );
							die();
						}
						$prompay_type=array("01"=>"เบอร์มือถือ","02"=>"เลขบัตร ปชช","03"=>"E-Wallet");
						?>
						
						
						<div class="row row-space">
                            <div class="col-2">
                                <div class="input-group">
									<label class="label"><b>Ref1 ID / Username :</b> <?=$connect_api["ref1"]?></label>
									<label class="label" id="pay4"><b>เลขพร้อมเพย์  :</b> <?=$prommpay_no?><br>
									<b>ประเภท :</b> <?=$prompay_type[$prommpay_type]?>
									</label>
									<label class="label" id="pay5"><b>ชื่อบัญชี :</b> <?=$prommpay_name?></label>
									<label class="label" id="pay6"><b>ยอดเงินที่ต้องโอน</b></label>
									<h1> <?=number_format($connect_api["amount_check"]/100,2)?> บาท</h1>
									<div class="label" style="color:red">**โอนจำนวนเงินให้ตรงกับยอดที่ปรากฏเท่านั้น </div>
                                </div>
                            </div>
                            <div class="col-2">
                                <div class="input-group" align="center">
									<?php
									$qr_url="data:image/png;base64,".$connect_api["qr_image_base64"];
									?>
									<label class="label" id="pay1"><img src="<?=$qr_url?>" width="98%"></label>
                                    <label class="label" id="pay2">สแกน QR เพื่อจ่ายเงิน</label>
									<label class="label" id="pay3">กรุณาโอนเงินภายในเวลา</label>
                                    <h1  style="color:red" id="time_count_down"><b>--</b></h1>
                                </div>
                            </div>
                        </div>
						
						<button class="btn btn--radius-2 btn--green btn-default has-spinner"  type="submit" onclick="window.location.href='?action=confirm'">แจ้งการโอนเงิน</button>
						<script>
							var sec_start=<?=$connect_api["time_out"]?>;
							setTimeout(time_down,0); 
						</script>
						<?php
					}else{
						$connect_api=connect_api($api_url."?username=$tmweasy_user&password=$tmweasy_password&con_id=$con_id");
						$connect_api=json_decode($connect_api,true);
						if($connect_api["status"]!="1"){
							
							$_SESSION["alert_content"]="Error : ".$connect_api["msg"];
							$_SESSION["alert_type"]="alert-danger";
						}
					?>
                    <form method="POST">

                       
						<div class="input-group">
                    
                            <div class="rs-select2 js-select-simple select--no-search">
							
                                 <label class="label">Ref1 ID / Username</label>
								<input class="input--style-4" value="<?=$_GET["ref1"]?>" type="text" name="ref1">
                            </div>
                        </div>
                        <div class="input-group">
                            <label class="label">จำนวนเงินที่ชำระ</label>
                            <?php
								if($mony_type==0){
									?>
									<input class="input--style-4" type="number" name="amount">
									<?php
								}else{
							?>
									<div class="rs-select2 js-select-simple select--no-search">
										<select name="amount">
											<?php
											$ii=0;
											while($ii<sizeof($mony_list)){
												echo "<option value='".$mony_list[$ii]."'>".$mony_list[$ii]." บาท</option>
												";
												$ii++;
											}
											?>
											
										</select>
										<div class="select-dropdown"></div>
									</div>
							<?php
								}
							?>
                        </div>
                        <div class="p-t-15">
							<div class="label" style="color:red">**เตรียมแอปชำระเงินของคุณให้พร้อมก่อนกดชำระเงิน</div>
                            <button class="btn btn--radius-2 btn--green btn-default has-spinner" onclick="this.form.submit();" type="submit" >กดเพื่อชำระเงิน</button>
                        </div>
                    </form>
					<?php
					}
					}
					?>
                </div>
            </div>
        </div>
    </div>

    <!-- Jquery JS-->
    <script src="vendor/jquery/jquery.min.js"></script>
    <!-- Vendor JS-->
    <script src="vendor/select2/select2.min.js"></script>
    <script src="vendor/datepicker/moment.min.js"></script>
    <script src="vendor/datepicker/daterangepicker.js"></script>

    <!-- Main JS-->
    <script src="js/global.js"></script>
	
	<?php
	if($_SESSION["alert_content"]){
		alert_content($_SESSION["alert_content"],$_SESSION["alert_type"]);
	}
	?>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.1.0/css/font-awesome.min.css" />
<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js"></script>
<link rel="stylesheet" href="https://netdna.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css">
<script src="https://code.jquery.com/jquery-1.11.3.min.js"></script>

<script>
/*A jQuery plugin which add loading indicators into buttons
* By Minoli Perera
* MIT Licensed.
*/
(function ($) {
    $.fn.buttonLoader = function (action) {
        var self = $(this);
        //start loading animation
        if (action == 'start') {
            if ($(self).attr("disabled") == "disabled") {
                e.preventDefault();
            }
            //disable buttons when loading state
            $('.has-spinner').attr("disabled", "disabled");
            $(self).attr('data-btn-text', $(self).text());
            //binding spinner element to button and changing button text
            $(self).html('<span class="spinner"><i class="fa fa-spinner fa-spin"></i></span>Loading');
            $(self).addClass('active');
        }
        //stop loading animation
        if (action == 'stop') {
            $(self).html($(self).attr('data-btn-text'));
            $(self).removeClass('active');
            //enable buttons after finish loading
            $('.has-spinner').removeAttr("disabled");
        }
    }
})(jQuery);

$(document).ready(function () {
    
    $('.has-spinner').click(function () {
        var btn = $(this);
        $(btn).buttonLoader('start');
        
    });
});
</script>
</body><!-- This templates was made by Colorlib (https://colorlib.com) -->
</html>