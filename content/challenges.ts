export const challenges = [
  {
    slug: "trace-the-login-click",
    levelSlug: "the-click-is-not-the-login",
    title: "Trace the login click",
    type: "sequence",
    difficulty: "medium",
    xpBase: 100,
    prompt: "A person clicks Login. Put the real steps in order, then attach what each step actually does.",
    scenario:
      "The form collects an email and a password. The account lives in a database on a server. The browser is not the database. Nothing is 'logged in' until a response comes back.",
    whyItMatters:
      "When an agent says login is broken, this is the map you use to ask a better question: which machine, which hop, which payload?",
    skills: [
      { slug: "networking", weight: 0.6 },
      { slug: "cs-fundamentals", weight: 0.2 },
      { slug: "architecture", weight: 0.2 },
    ],
    definition: {
      steps: [
        { id: "render", label: "Browser updates the page" },
        { id: "db_read", label: "Server reads the user from the database" },
        { id: "ui_event", label: "Browser handles the Login click" },
        { id: "verify_secret", label: "Server compares the password to a hash" },
        { id: "dns_tls", label: "DNS and HTTPS connect to the host" },
        { id: "build_request", label: "Browser builds an HTTP request" },
        { id: "http_response", label: "Server sends an HTTP response" },
        { id: "api_handler", label: "Login route runs on the server" },
        { id: "server_accept", label: "Server process accepts the connection" },
      ],
      explanations: [
        { id: "ui_event", text: "The click is only an event in the browser. Nobody is logged in yet." },
        { id: "build_request", text: "The page builds POST /login with the email and password in the body." },
        { id: "dns_tls", text: "The browser looks up the host and encrypts the connection before the password leaves." },
        { id: "server_accept", text: "A process on the server is listening on a port and accepts this connection." },
        { id: "api_handler", text: "Application code runs. This is not the database and not the browser." },
        { id: "db_read", text: "The server loads the user row, including the password hash." },
        { id: "verify_secret", text: "The server compares the submitted password to the stored hash." },
        { id: "http_response", text: "The response reports the result and can set a session cookie." },
        { id: "render", text: "The browser paints the logged-in screen from that response." },
        { id: "disk", text: "The browser opens the server's password file from the laptop disk." },
        { id: "skip", text: "HTTPS carries the password straight into the database, skipping application code." },
        { id: "paint", text: "The database reaches over and changes the button color." },
        { id: "plain", text: "The server saves the typed password so it can read it back later." },
      ],
    },
    rubric: {
      correctOrder: [
        "ui_event",
        "build_request",
        "dns_tls",
        "server_accept",
        "api_handler",
        "db_read",
        "verify_secret",
        "http_response",
        "render",
      ],
      explanationByStep: {
        ui_event: "ui_event",
        build_request: "build_request",
        dns_tls: "dns_tls",
        server_accept: "server_accept",
        api_handler: "api_handler",
        db_read: "db_read",
        verify_secret: "verify_secret",
        http_response: "http_response",
        render: "render",
      },
      lessons: {
        ui_event: {
          principle: "A click is a browser event.",
          productionImpact: "If you only inspect the database, you miss a broken button that never sent a request.",
          hint: "The click has to happen before any network call.",
        },
        build_request: {
          principle: "The browser has to build an HTTP request.",
          productionImpact: "A handler that expects JSON will fail if the page never put JSON on the wire.",
          hint: "Method, URL, and body exist before DNS.",
        },
        dns_tls: {
          principle: "HTTPS needs a name lookup and a TLS handshake.",
          productionImpact: "A bad domain or certificate fails before your login code runs.",
          hint: "The password should not move until the connection is encrypted.",
        },
        server_accept: {
          principle: "A process must be listening.",
          productionImpact: "If nothing is bound to the port, the request never reaches a route.",
          hint: "Accepting a connection is not the same as running the login function.",
        },
        api_handler: {
          principle: "A route is application code.",
          productionImpact: "Putting this after the database read means you queried before any code decided to.",
          hint: "The handler runs, then it asks the database.",
        },
        db_read: {
          principle: "The hash lives in the database. The comparison does not have to.",
          productionImpact: "You cannot compare a password you have not loaded.",
          hint: "Read the row before you check the secret.",
        },
        verify_secret: {
          principle: "The server compares a hash. It should not store the raw password.",
          productionImpact: "Saving the typed password turns one database leak into every other account the person reused.",
          hint: "Compare after the row is loaded, and before you tell the browser it worked.",
        },
        http_response: {
          principle: "The server answers with an HTTP response.",
          productionImpact: "Without a response, the browser cannot know whether to show an error or a session.",
          hint: "The cookie rides on the response, not on the click.",
        },
        render: {
          principle: "The browser updates the UI from the response.",
          productionImpact: "A 200 that the page ignores still looks like a broken login to the user.",
          hint: "Painting the screen is the last step.",
        },
      },
    },
  },
  {
    slug: "build-a-login",
    levelSlug: "a-login-you-can-defend",
    title: "Build a login architecture",
    type: "architecture",
    difficulty: "medium",
    xpBase: 150,
    prompt: "Turn on the pieces a login needs and connect them. Then say, in a sentence or two, what this design protects.",
    scenario:
      "You are about to ask an agent to build login. Before it writes code, decide the shape. Two honest designs exist: a server-side session, or a signed token. The browser never talks to the database.",
    whyItMatters:
      "Most generated login code is a pile of files. This is the picture you use to review it.",
    skills: [
      { slug: "architecture", weight: 0.5 },
      { slug: "security", weight: 0.4 },
      { slug: "networking", weight: 0.1 },
    ],
    definition: {
      nodes: [
        { id: "browser", label: "Browser", lane: "client", blurb: "The login form." },
        { id: "login_api", label: "Login API", lane: "application", blurb: "POST /login." },
        { id: "password_hasher", label: "Password hasher", lane: "application", blurb: "Compares a hash. Never stores the raw password." },
        { id: "auth_check", label: "Auth check", lane: "application", blurb: "Later requests prove who is calling." },
        { id: "token_issuer", label: "Token issuer", lane: "application", blurb: "Signs a token the browser will send back." },
        { id: "user_database", label: "User database", lane: "data", blurb: "The user row and the password hash." },
        { id: "session_store", label: "Session store", lane: "data", blurb: "A server-side record of the login." },
      ],
    },
    rubric: {
      requiredNodeIds: ["browser", "login_api", "password_hasher", "user_database"],
      oneOfNodeSets: [["session_store"], ["token_issuer"]],
      requiredEdges: [
        { from: "browser", to: "login_api" },
        { from: "login_api", to: "user_database" },
        { from: "login_api", to: "password_hasher" },
      ],
      conditionalEdges: [
        { whenNode: "session_store", edges: [{ from: "login_api", to: "session_store" }] },
        { whenNode: "token_issuer", edges: [{ from: "login_api", to: "token_issuer" }] },
      ],
      forbiddenEdges: [
        {
          from: "browser",
          to: "user_database",
          principle: "The browser does not get a connection string.",
          productionImpact: "Anyone with the page can read every user row.",
          hint: "The browser may only talk to the login API.",
        },
        {
          from: "browser",
          to: "password_hasher",
          principle: "Hashing on the client does not replace a server check.",
          productionImpact: "The hash becomes the password. A stolen hash logs in as that person.",
          hint: "The server hashes and compares.",
        },
        {
          from: "browser",
          to: "session_store",
          principle: "The browser does not write its own session.",
          productionImpact: "A caller can invent a session row and become anyone.",
          hint: "Only the login API creates the session, after the password check.",
        },
      ],
      rationaleConcepts: [
        { label: "passwords are hashed", phrases: ["hash", "hashed", "bcrypt", "argon"] },
        { label: "a cookie, session, or token", phrases: ["cookie", "session", "token", "jwt"] },
      ],
      rationaleNeeded: 2,
    },
  },
  {
    slug: "design-users-and-orgs",
    levelSlug: "users-and-organizations",
    title: "Design users and organizations",
    type: "schema",
    difficulty: "medium",
    xpBase: 120,
    prompt: "Create the tables and foreign keys. A person can belong to more than one organization.",
    scenario:
      "A small SaaS has people and companies. Ada is in Northwind and in her own studio. Jordan is only in Northwind. Email is how they sign in. Do not store a raw password.",
    whyItMatters:
      "Agents love a users.organization_id column. That column deletes Ada's second company the moment she joins it.",
    skills: [
      { slug: "databases", weight: 0.8 },
      { slug: "architecture", weight: 0.2 },
    ],
    definition: {
      brief: "Users, organizations, and a way for one user to be in many organizations.",
      columnTypes: ["text", "integer", "boolean", "timestamp", "uuid"],
    },
    rubric: { notes: "Join table required. No plaintext password." },
  },
  {
    slug: "invoice-that-isnt-yours",
    levelSlug: "the-invoice-that-is-not-yours",
    title: "Debug the invoice API",
    type: "debug",
    difficulty: "medium",
    xpBase: 120,
    prompt: "A customer changed the id in the URL and saw someone else's invoice. Mark the line, the cause, and the fix.",
    scenario:
      "GET /invoices/1842 returns Northwind's invoice to a user who works at another company. The caller is signed in. The status code is 200.",
    whyItMatters:
      "This is the bug behind 'I changed the id in the URL.' Generated CRUD almost always ships it.",
    skills: [
      { slug: "security", weight: 0.7 },
      { slug: "networking", weight: 0.3 },
    ],
    definition: {
      lines: [
        { n: 1, text: "export async function getInvoice(req, res) {" },
        { n: 2, text: "  const session = await getSession(req);" },
        { n: 3, text: "  if (!session) return res.status(401).json({ error: 'Sign in' });" },
        { n: 4, text: "  const invoice = await db.invoice.findUnique({" },
        { n: 5, text: "    where: { id: req.params.invoiceId }," },
        { n: 6, text: "  });" },
        { n: 7, text: "  if (!invoice) return res.status(404).json({ error: 'Not found' });" },
        { n: 8, text: "  return res.status(200).json({ invoice });" },
        { n: 9, text: "}" },
      ],
      request: "GET /invoices/1842\nCookie: session=ada",
      response: "200 { invoice: { id: 1842, userId: 'jordan', total: 4200 } }",
      logs: [
        "auth session=ada userId=ada",
        "invoice.findUnique id=1842",
        "respond 200 bytes=86",
      ],
      causeOptions: [
        { id: "missing_authz", label: "The handler never checks that this invoice belongs to the signed-in user." },
        { id: "sql_injection", label: "The invoice id is concatenated into a SQL string." },
        { id: "wrong_status", label: "A missing invoice returns the wrong status code." },
        { id: "cors", label: "The browser blocks the response because of CORS." },
      ],
      fixOptions: [
        { id: "compare_owner", label: "Return 404 unless invoice.userId matches the session user." },
        { id: "parameterize", label: "Send the id as a query parameter instead of building SQL by hand." },
        { id: "return_500", label: "Return 500 whenever the invoice is missing." },
        { id: "add_cors", label: "Add Access-Control-Allow-Origin: * so every site can read the response." },
      ],
    },
    rubric: {
      buggyLines: [5, 8],
      causeId: "missing_authz",
      fixId: "compare_owner",
      lineMiss: {
        principle: "The hole is where the invoice is loaded or returned with no owner check.",
        productionImpact: "Line 3 proves the caller is signed in. It does not prove the invoice is theirs.",
        hint: "Look at the query's where clause and the 200 that returns the row.",
      },
      wrongCause: {
        sql_injection: {
          principle: "This query passes the id as data to findUnique. That is not string-built SQL.",
          productionImpact: "Chasing injection leaves the real bug in production: any signed-in user can read any invoice.",
          hint: "The session user and the invoice owner are never compared.",
        },
        wrong_status: {
          principle: "The invoice exists. The status is not the bug.",
          productionImpact: "A different 404 message would still hand Jordan's invoice to Ada.",
          hint: "The response body contains another customer's total.",
        },
        cors: {
          principle: "CORS is a browser rule about which sites may read a response. This request already succeeded.",
          productionImpact: "Opening CORS wider would make the leak easier, not close it.",
          hint: "The server chose to return the row. That is authorization.",
        },
      },
      wrongFix: {
        parameterize: {
          principle: "The id is already a parameter.",
          productionImpact: "The query stays 'any invoice by id' and the leak stays.",
          hint: "Constrain the row to the session user, or reject it after you load it.",
        },
        return_500: {
          principle: "A missing invoice is a 404, not an outage.",
          productionImpact: "500s page the on-call for a typo, and they still do not fix the leak.",
          hint: "Hide rows the caller does not own. Do not pretend the server crashed.",
        },
        add_cors: {
          principle: "A wildcard CORS header is not an authorization check.",
          productionImpact: "More websites can now read the invoice the API already leaked.",
          hint: "Compare invoice.userId to the session user and return 404 on a mismatch.",
        },
      },
    },
  },
  {
    slug: "double-charge-incident",
    levelSlug: "the-double-charge",
    title: "The double charge incident",
    type: "incident",
    difficulty: "production",
    xpBase: 300,
    prompt: "Twenty thousand customers. Stripe is returning intermittent 500s. Some people were charged twice. Decide what happened, what to change, how to test it, and how to ship it.",
    scenario:
      "Pay stays enabled. The first POST /api/checkout often times out after Stripe has already created a charge. The browser retries. Support has four tickets with two successful charges and one angry customer each.",
    whyItMatters:
      "A timeout plus a retry is normal. A payment handler that is not safe to repeat will bill people twice.",
    skills: [
      { slug: "production", weight: 0.5 },
      { slug: "testing", weight: 0.3 },
      { slug: "architecture", weight: 0.2 },
    ],
    definition: {
      logs: [
        "14:02:11 POST /api/checkout user=ada key=none stripe=200 charge=ch_91 duration=8200ms",
        "14:02:12 client retry POST /api/checkout user=ada key=none",
        "14:02:13 POST /api/checkout user=ada key=none stripe=200 charge=ch_92 duration=400ms",
        "14:06:40 POST /api/checkout user=jordan key=none stripe=500",
        "14:06:41 client retry POST /api/checkout user=jordan key=none stripe=200 charge=ch_93",
        "14:11:02 support ticket: Ada charged $49 twice, charges ch_91 and ch_92",
      ],
      code: `export async function checkout(req, res) {
  const session = await getSession(req);
  const charge = await stripe.charges.create({
    amount: 4900,
    currency: "usd",
    customer: session.stripeCustomerId,
    // no idempotency key
  });
  await db.payment.create({ data: { userId: session.userId, chargeId: charge.id } });
  return res.json({ ok: true, chargeId: charge.id });
}`,
      notes: [
        "The Pay button is disabled only after a 200 response.",
        "The browser retries when the first request exceeds 8 seconds.",
        "Stripe will dedupe if you send the same Idempotency-Key.",
        "There is no unique constraint on a checkout attempt.",
      ],
      stages: [
        {
          id: "symptom",
          prompt: "What is the customer-visible failure?",
          options: [
            { id: "double_charge", label: "Some customers were charged twice for one purchase." },
            { id: "site_down", label: "The whole product is down for every user." },
            { id: "fee_change", label: "Stripe changed its fee and the totals look higher." },
          ],
        },
        {
          id: "mechanism",
          prompt: "What mechanism created the second charge?",
          options: [
            { id: "retry_no_idempotency", label: "A retry ran the charge again because the request had no idempotency key." },
            { id: "webhook_loop", label: "Stripe webhooks called the handler thousands of times per second." },
            { id: "hash_mismatch", label: "Password hashes stopped matching, so the app retried billing." },
          ],
        },
        {
          id: "fix",
          prompt: "What do you change?",
          options: [
            { id: "idempotency_key", label: "Save a checkout attempt id, send it as Stripe's idempotency key, and return the original result on a retry." },
            { id: "disable_button", label: "Disable the Pay button with CSS. Leave the API as it is." },
            { id: "cache_stripe", label: "Cache Stripe's homepage so the 500s stop." },
          ],
        },
        {
          id: "tests",
          prompt: "Which test has to exist before this is done?",
          options: [
            { id: "same_key_once", label: "Submit the same checkout twice and assert that one charge exists." },
            { id: "snapshot_css", label: "A screenshot test that the Pay button is blue." },
            { id: "load_only", label: "A load test that only checks the server stays up." },
          ],
        },
        {
          id: "ship",
          prompt: "How do you ship the fix?",
          options: [
            { id: "staging_then_prod", label: "Deploy to staging, run the duplicate-submit test, then production." },
            { id: "hotfix", label: "Ship a small hotfix once the new test passes in CI." },
            { id: "rewrite", label: "Rewrite billing as microservices tonight and deploy it all at once." },
          ],
        },
      ],
    },
    rubric: {
      passCount: 4,
      stages: [
        {
          id: "symptom",
          correctOptionIds: ["double_charge"],
          wrong: {
            site_down: {
              principle: "Read the blast radius before you name the incident.",
              productionImpact: "Jordan's 500 was retried into a success. The site is up. Ada was billed twice.",
              hint: "The support ticket is the symptom. The 500 is a clue.",
            },
            fee_change: {
              principle: "A second charge id is not a fee change.",
              productionImpact: "You would argue with Stripe's pricing while ch_91 and ch_92 both settle.",
              hint: "Two charge ids for one click is the bug.",
            },
          },
        },
        {
          id: "mechanism",
          correctOptionIds: ["retry_no_idempotency"],
          wrong: {
            webhook_loop: {
              principle: "The logs show the browser retrying POST /api/checkout, not a webhook storm.",
              productionImpact: "You would spend the incident in the wrong queue.",
              hint: "key=none on both of Ada's charges.",
            },
            hash_mismatch: {
              principle: "This path never checks a password.",
              productionImpact: "A password rotation does not refund Ada.",
              hint: "Follow the two stripe=200 lines.",
            },
          },
        },
        {
          id: "fix",
          correctOptionIds: ["idempotency_key"],
          wrong: {
            disable_button: {
              principle: "The client is not the authority for money.",
              productionImpact: "A timeout, a second tab, or a flaky network still runs the handler twice.",
              hint: "The server must recognize a repeat of the same checkout.",
            },
            cache_stripe: {
              principle: "Caching a website does not make a charge safe to repeat.",
              productionImpact: "The next timeout still creates ch_94.",
              hint: "Send an idempotency key and store the attempt.",
            },
          },
        },
        {
          id: "tests",
          correctOptionIds: ["same_key_once"],
          wrong: {
            snapshot_css: {
              principle: "A color is not a payment invariant.",
              productionImpact: "The button can look right while the second POST creates a charge.",
              hint: "Assert one charge for two identical submits.",
            },
            load_only: {
              principle: "Staying up is not the same as charging once.",
              productionImpact: "A healthy server can still double-bill under retry.",
              hint: "The test has to count charges, not just status codes.",
            },
          },
        },
        {
          id: "ship",
          correctOptionIds: ["staging_then_prod", "hotfix"],
          wrong: {
            rewrite: {
              principle: "An incident is a bad time to change the shape of the system.",
              productionImpact: "A new platform ships new failure modes while Ada is still double-charged.",
              hint: "Ship the smallest fix that makes the retry safe, through a test.",
            },
          },
        },
      ],
    },
  },
  {
    slug: "explain-the-login",
    levelSlug: "explain-it-to-the-senior",
    title: "Explain the login to a senior",
    type: "explain",
    difficulty: "medium",
    xpBase: 100,
    prompt: "Explain this design in plain language. A senior will ask what happens, why it is built this way, what can fail, and what tradeoff you accepted.",
    scenario:
      "You did not write this login. An agent did. You are about to approve the pull request. Write the explanation you would say out loud.",
    whyItMatters:
      "AI can write the code. If you cannot explain the decision, you cannot review it, debug it, or defend it.",
    skills: [
      { slug: "ai-engineering", weight: 0.4 },
      { slug: "architecture", weight: 0.3 },
      { slug: "security", weight: 0.3 },
    ],
    definition: {
      architecture: `Browser form
  POST /login { email, password }
    Login API
      reads the users row from Postgres
      bcrypt.compare(password, user.passwordHash)
      inserts a row into sessions
      Set-Cookie: sessionId; HttpOnly; Secure
    later requests
      Auth check reads that session row`,
      prompts: [
        "What is happening, step by step?",
        "Why is the password stored as a hash, and why is there a session row?",
        "What could fail or be stolen?",
        "What tradeoff are you accepting compared with a signed token and no session table?",
      ],
    },
    rubric: {
      minToPass: 4,
      concepts: [
        {
          id: "hash",
          label: "Password hash",
          phrases: ["hash", "hashed", "bcrypt", "argon"],
          missed: {
            principle: "The database stores a hash, not the password.",
            productionImpact: "Call a hash a password and the next change will log the raw secret.",
            hint: "Say hash, bcrypt, or that the raw password is not stored.",
          },
        },
        {
          id: "http",
          label: "HTTP request",
          phrases: ["http", "post", "request", "cookie"],
          missed: {
            principle: "The browser sends an HTTP request. The click is not the login.",
            productionImpact: "You will look for the bug in the button instead of on the wire.",
            hint: "Name the POST, the request, or the cookie.",
          },
        },
        {
          id: "database",
          label: "Database row",
          phrases: ["postgres", "database", "row", "table"],
          missed: {
            principle: "The user and the session are rows.",
            productionImpact: "Without that, 'session' is a magic word instead of a record you can expire.",
            hint: "Mention the database, Postgres, or the row.",
          },
        },
        {
          id: "session",
          label: "Server-side session",
          phrases: ["session", "cookie"],
          missed: {
            principle: "Later requests are authenticated by a session the server stored.",
            productionImpact: "You cannot explain logout, expiry, or revocation.",
            hint: "Name the session or the cookie.",
          },
        },
        {
          id: "failure",
          label: "A way this fails",
          phrases: ["steal", "stolen", "xss", "leak", "hijack", "guess", "theft", "revoke"],
          missed: {
            principle: "Name a failure: a stolen cookie, a leaked database, a guessable password.",
            productionImpact: "A design with no failure mode gets approved with the failure still in it.",
            hint: "Say what an attacker would steal or what you can revoke.",
          },
        },
        {
          id: "tradeoff",
          label: "Session versus token",
          phrases: ["token", "jwt", "stateless", "revoke", "revocation"],
          missed: {
            principle: "A session row can be deleted. A signed token lives until it expires unless you add extra machinery.",
            productionImpact: "You cannot answer 'why not JWT?' and the next rewrite picks one by accident.",
            hint: "Mention a token, JWT, or the fact that you can revoke a session.",
          },
        },
      ],
    },
  },
] as const;
