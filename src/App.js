import React, { Component } from 'react'
import api from 'wordpress-rest-api-oauth-1'
import qs from 'qs'
import './App.css'

export default class App extends Component {
	constructor() {
		super()
		let savedState = JSON.parse( localStorage.getItem( 'state' ) )
		this.state = {
			url: '',
			oauthKey: '',
			oauthSecret: '',
			callbackURL: '',
			requestToken: null,
			requestTokenError: null,
			redirectedURL: '',
			accessToken: null,
			accessTokenError: null,
			authenticatedRequestURL: '',
			authenticatedRequestResponse: null,
			authenticatedRequestError: null,
			...savedState,
		}

		if ( savedState ) {
			this.setupApi()
		}
	}

	componentWillMount() {
		window.onunload = () => {
			localStorage.setItem( 'state', JSON.stringify(this.state))
		}
	}

	setupApi() {
		this.api = new api({
			url: this.state.url,
			credentials: {
				client: {
					public: this.state.oauthKey,
					secret: this.state.oauthSecret,
				}
			},
			callbackURL: this.state.callbackURL
		})
	}

	onGetRequestToken(e) {
		e.preventDefault()
		this.setState({requestTokenError:null})

		this.setupApi()

		this.api.getRequestToken()
			.then( requestToken => {
				this.setState({requestToken})
			})
			.catch( requestTokenError => this.setState({requestTokenError}) )
	}

	onGetAccessToken(e) {
		e.preventDefault()
		this.setState({accessTokenError:null})

		let args = {}
		if ( this.state.redirectedURL.indexOf( '?' ) ) {
			args = qs.parse( this.state.redirectedURL.split('?')[1] )
		} else {
			args = { oauth_token: this.state.redirectedURL }
		}
		this.api.config.credentials.token.public = args.oauth_token
		this.api.getAccessToken(args.oauth_verifier)
			.then( accessToken => this.setState({accessToken}) )
			.catch( accessTokenError => this.setState({accessTokenError}) )
	}

	onSendAuthenticatedRequest(e) {
		e.preventDefault()

		this.api.get( '/' + this.state.authenticatedRequestURL, { _envelope: true } )
			.then( authenticatedRequestResponse => this.setState({authenticatedRequestResponse}) )
			.catch( authenticatedRequestError => this.setState({authenticatedRequestError}))
	}

	render() {
		return <div className="App">
			<h1>WordPress REST API OAuth 1 Debugger</h1>

			<h3>Step 1: Get a Request Token</h3>
			<p className="description">Enter your OAuth 1 app details below. This is provided by your WordPress site running the <a href="https://github.com/WP-API/OAuth1">OAuth 1</a> plugin by going to the dashboard "Users -> Applications" page. A "request token"  is needed to redirect the user to the "authorize" page on the WordPress site.</p>
			<form onSubmit={this.onGetRequestToken.bind(this)}>
				<p>
					<label>Site URL</label>
					<input
						type="url"
						required={true}
						value={this.state.url} onChange={e => this.setState({url: e.target.value})}
					/>
				</p>
				<p>
					<label>OAuth 1 Client Key</label>
					<input
						type="text"
						required={true}
						value={this.state.oauthKey} onChange={e => this.setState({oauthKey: e.target.value})}
					/>
				</p>
				<p>
					<label>OAuth 1 Client Secret</label>
					<input
						type="text"
						required={true}
						value={this.state.oauthSecret} onChange={e => this.setState({oauthSecret: e.target.value})}
					/>
				</p>
				<p>
					<label>Callback URL</label>
					<input
						type="text"
						required={true}
						value={this.state.callbackURL} onChange={e => this.setState({callbackURL: e.target.value})}
					/>
				</p>

				<p className="actions">
					<button>Get Request Token</button>
				</p>
			</form>

			{this.state.requestToken ?
				<div>
					<p>Request Token:</p>
					<pre>{JSON.stringify( this.state.requestToken.token, null, 4 )}</pre>

					<h3>Step 2: Authorize the app</h3>

					<p>Go to <a target="_blank" href={this.state.requestToken.redirectURL}>{this.state.requestToken.redirectURL}</a>, click Authorize and copy the URL you are redirected to (should start with the Callback URL of your app). If the app is using out of band OAuth, paste the verification token.</p>

					<form onSubmit={this.onGetAccessToken.bind(this)}>
						<p>
							<label>Redirected URL or verification token</label>
							<input
								required={true}
								type="text"
								value={this.state.redirectedURL}
								onChange={e=>this.setState({redirectedURL:e.target.value})}
							/>
						</p>
						<p className="actions">
							<button>Get Access Token</button>
						</p>
					</form>
				</div>
			: null}

			{this.state.requestTokenError ?
				<div className="error">
					{this.state.requestTokenError.message}
				</div>
			: null }

			{this.state.accessTokenError ?
				<div className="error">
					{this.state.accessTokenError.message}
				</div>
			: null }

			{this.state.accessToken ?
				<div>
					<p>Access Token:</p>
					<pre>{JSON.stringify( this.state.accessToken, null, 4 )}</pre>

					<h3>Step 3: Make authenticated requests</h3>
					<p className="description">Request to the REST API will now be authenticated using OAuth 1. Try making any request below such as "/wp/v2/users/me".</p>
					<form onSubmit={this.onSendAuthenticatedRequest.bind(this)}>
						<p>
							<label>REST API Endpoint</label>
							<span className="input-with-preceding-text">
								<span>{this.state.url}wp-json/</span>
								<input
									type="text"
									value={this.state.authenticatedRequestURL}
									onChange={e => this.setState({authenticatedRequestURL:e.target.value})}
									/>
							</span>
						</p>
						<p className="actions">
							<button>Send Request</button>
						</p>

						{this.state.authenticatedRequestResponse ?
							<div>
								<h4>Response:</h4>
								<pre>{JSON.stringify( this.state.authenticatedRequestResponse, null, 4 )}</pre>
							</div>
						: null}

						{this.state.authenticatedRequestError ?
							<div className="error">
								{this.state.authenticatedRequestError.message}
							</div>
						: null }
					</form>
				</div>
			: null}
		</div>
	}
}
