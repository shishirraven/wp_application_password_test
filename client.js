(function($){
	const $root = $( '#root' );
	const $stage1 = $( '.stage-1', $root );
	const $stage2 = $( '.stage-2', $root );

	// If there's no GET string, then no credentials have been passed back.  Let's get them.
	if ( ! window.location.href.includes('?') ) {

		// Stage 1: Get the WordPress Site URL, Validate the REST API, and Send to the Authentication Flow
		const $urlInput = $( 'input[type=url]', $stage1 );

		$('input[type=submit]', $stage1).click(function(event){
			event.preventDefault();

			if ( $urlInput[0].validity.valid ) {
				let linky = $urlInput.val() + '?rest_route=/';
				$stage1.append( '<p>Attempting to query <a href="' + linky + '">' + linky + '</a>…</p>' );
				$.getJSON( linky, function( data ) {
					// If it doesn't look like a WordPress REST API response, bail!
					if ( ! data.url ) {
						$stage1.append( '<p>Error: ' + linky + ' does not seem to be a WordPress REST API.</p>' );
						return;
					}

					console.log( data );
					// Yay, we found WordPress!  Report back to the user.
					$stage1.append( '<p>Success: Found <strong>' + data['name'] + '</strong>' +
						( data.description ? ': <em>' + data.description + '</em></p>' : '</p>' ) );

					// If no Application Passwords, bail.
					if ( ! data.authentication['application-passwords'] ) {
						$stage1.append('<p>Looks like Application Passwords is not available!</p>');
						$urlInput.focus();
						return;
					}

					// Yay we have Application Passwords!
					const authorizationLinky = data.authentication['application-passwords'].endpoints.authorization +
						'?' + $.param( {
							app_name: 'Test Application',
							// We're appending `site_url` here until core passes the siteurl back with it.
							success_url: location.href + '?site_url=' + linky.split('?')[0]
						} );

					// Display the link for the user to authenticate.
					$stage1.append( '<p>Would you like to <a href="' + authorizationLinky + '">authenticate with that site</a>?</p>' );
				} );
			} else {
				$stage1.append( '<p>Error: ' + $urlInput.val() + ' does not seem to validate as a url.</p>') ;
			}
		});
	} else {
		$stage1.hide();
		const credentials = new URLSearchParams( window.location.href.split('?')[1] );

		$stage2.append( '<p>Got credentials! user: <kbd>' + credentials.get('user_login') + '</kbd>' +
			' pass: <kbd>' + credentials.get('password') + '</kbd></p>' );

		const api_root = credentials.get('site_url') + '?rest_route=/';

		$stage2.append( '<p>Making authenticated request to site to list users…</p>' );
		// using & instead of ? as we're already using the rest_route get arg.
		$.ajax( api_root + 'wp/v2/users&context=edit', {
			crossDomain: true,
			headers: {
				"Authorization": "Basic " + btoa( credentials.get('user_login') + ":" + credentials.get('password') )
			},
			success: function( data ) {
				$stage2.append( '<p>Found ' + data.length + ' user(s):</p>' );
				$.each( data, function( index, user ) {
					$stage2.append( '<p>User ID ' + user.id + ': "' + user.username + '" &lt;' + user.email + '&gt;</p>' );
				});
			}
		});
	}

})(jQuery);
