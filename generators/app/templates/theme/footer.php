<?php wp_footer(); ?>

<?php if(defined("WPSITE_DEV") && WPSITE_DEV == true): ?>
    <script id="__bs_script__">//<![CDATA[
        document.write("<script async src='https://HOST:3000/browser-sync/browser-sync-client.js?v=2.23.6'><\/script>".replace("HOST", location.hostname));
        //]]></script>
<?php endif; ?>

</body>
</html>
