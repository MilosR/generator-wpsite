<?php

/**
 * Support for thumbnails
 */
add_theme_support('post-thumbnails', array('post', 'page'));

/**
 * Register menus
 */
register_nav_menus(array(
    'header' => 'Main Menu',
));

/**
 * Registers an editor stylesheet for the theme.
 */
add_action('admin_init', function () {
    add_editor_style('editor-style.css');
});


/**
 * Prevents editor style caching
 * Adds a parameter of the last modified time to all editor stylesheets.
 *
 * @wp-hook mce_css
 * @param  string $css Comma separated stylesheet URIs
 * @return string
 */
add_filter('mce_css', function ($css) {
    global $editor_styles;

    if (empty ($css) or empty ($editor_styles)) {
        return $css;
    }

    // Modified copy of _WP_Editors::editor_settings()
    $mce_css = array();
    $style_uri = get_stylesheet_directory_uri();
    $style_dir = get_stylesheet_directory();

    if (is_child_theme()) {
        $template_uri = get_template_directory_uri();
        $template_dir = get_template_directory();

        foreach ($editor_styles as $key => $file) {
            if ($file && file_exists("$template_dir/$file")) {
                $mce_css[] = add_query_arg(
                    'version',
                    filemtime("$template_dir/$file"),
                    "$template_uri/$file"
                );
            }
        }
    }

    foreach ($editor_styles as $file) {
        if ($file && file_exists("$style_dir/$file")) {
            $mce_css[] = add_query_arg(
                'version',
                filemtime("$style_dir/$file"),
                "$style_uri/$file"
            );
        }
    }

    return implode(',', $mce_css);
});


/**
 * TinyMCE Modifications
 */
add_filter('tiny_mce_before_init', function ($init) {

    $init['block_formats'] = 'Paragraph=p;Heading 2=h2;Heading 3=h3';

    return $init;
});


/**
 * Enqueue Scripts and Styles
 */

add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style('main', get_stylesheet_uri(), [], "1.0");
    wp_enqueue_script('main', get_stylesheet_directory_uri() . "/main.js", [], "1.0");
});


/**
 * Hide editor
 */

add_action('admin_init', function () {

    $post_id = $_GET['post'] ? $_GET['post'] : $_POST['post_ID'];

    if (!isset($post_id)) return;

    $template_file = str_replace('.php', '', get_post_meta($post_id, '_wp_page_template', true));

    if (in_array($template_file, [
        'template-home',
    ])) {
        remove_post_type_support('page', 'editor');
    }


});

/**
 * Custom Login Logo
 */
add_action('login_enqueue_scripts', function(){
    ?>
    <style type="text/css">
        body.login div#login h1 a {
            width: 170px;
            background-size: contain;
            background-position: center;
            background-image: url("<?php echo get_stylesheet_directory_uri()."/images/logo-login.jpg" ?>");
            padding-bottom: 30px;
        }
    </style>
    <?php
});



/**
 * Custom Query parameters
 * @param $vars
 * @return array
 */
add_filter( 'query_vars', function( $vars ) {
    $vars[] = 'dev-slug';
    return $vars;
} );

/**
 * Rewrite for dev-*.php files
 */
add_action('init', function() {

    add_rewrite_tag( '%dev-slug%', '([^&]+)' );
    add_rewrite_rule(
        '^dev/([^/]*)/?',
        'index.php?dev-slug=$matches[1]',
        'top'
    );

});

/**
 * Template Redirect
 */
add_action( 'template_redirect', function(){

    global $wp_query;

    if (
        defined("WPSITE_DEV") &&
        WPSITE_DEV == true
    ) {

        $page = get_query_var('dev-slug');
        $page = preg_replace('/[^A-Za-z0-9\. -]/', '', $page);
        $file = get_stylesheet_directory() . "/dev-".$page.".php";

        if($page && file_exists($file)){

            include $file;
            exit;

        }

    }

} );


include "includes/helpers.php";
include "includes/piklist.php";















