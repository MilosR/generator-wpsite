<?php get_header(); ?>

<?php /* Delete below and add yout content */ ?>

<div id="window">
	<h1>WPSITE Generated Theme</h1>
	<p>Your Theme is successfully generated. Username & password for WP login are: "admin"</p>
	<br>
	<h2>Getting started</h2>
	<p>
		To get started you can edit /wp-content/themes/<%= themeName %>/index.php file where you can erase content for this page
	</p>
	<h2>Laravel Mix</h2>
	<p>
		By calling <kbd>npm run watch</kbd> in theme folder you can run Laravel Mix (WebPack) which is configured to run file watcher and reload browser on changes(BrowserSync), to compile your SCSS to CSS, and to build main JS file by transpiling ES6 to ES5
	</p>
    <h2>Dev files</h2>
    <p>
        Use dev-*.php file pattern to create files. Visiting page /dev/* will then serve you created page. Example is dev-home.php and you can visit <a href="/dev/home">/dev/home</a>
    </p>
    <h2>Production</h2>
    <p>
        To disable /dev rewrite rules and BrowserSync script set <kbd>WPSITE_DEV</kbd> to false.
    </p>
</div>

<style type="text/css">

	html,
	body{
		margin: 0;
		padding: 0;
		width: 100%;
		height: 100%;
		overflow: hidden;
		font-family: Lato;
		font-size: 0.9em;
		line-height: 1.6em;
	}
	
	body{
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		background: #6f87d6;
	}

	#window{
		text-align: center;
		width: 600px;
		border-radius: 5px;
		background: white;
		padding: 40px;
		box-shadow: 0px 0px 10px rgba(0,0,0,0.4);
	}

	kbd{
		padding: 3px 4px;
		vertical-align: middle;
		border-radius: 2px;
		background: white;
		margin: 0 3px;
		background: #6f87d6;
		color: white;
		font-weight: bold
	}

	a{
		color: #6f87d6;
	}

	#window h1,
	#window h2,
	#window p{
		margin: 20px 0;
		font-weight: 400
	}
	
	#window p{
		color: rgba(0,0,0,0.4);
	}

</style>

<link href="https://fonts.googleapis.com/css?family=Lato" rel="stylesheet"> 

<?php /* ------------------ */ ?>

<?php get_footer(); ?>
