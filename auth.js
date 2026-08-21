/* ==========================================
   STUDENTIQ AUTHENTICATION
========================================== */


const DEMO_EMAIL =
    "faculty@studenteq.ai";

const DEMO_PASSWORD =
    "123456";


/* ------------------------------------------
   INITIALIZE DEMO ACCOUNT
------------------------------------------ */

function initializeAuth() {

    if (
        !localStorage.getItem(
            "studentiq_users"
        )
    ) {

        const users = [

            {
                name: "Faculty User",
                email: DEMO_EMAIL,
                password: DEMO_PASSWORD,
                role: "Administrator"
            }

        ];

        localStorage.setItem(
            "studentiq_users",
            JSON.stringify(users)
        );

    }

}


initializeAuth();


/* ------------------------------------------
   LOGIN
------------------------------------------ */

const loginForm =
    document.getElementById(
        "loginForm"
    );


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const email =
                document
                    .getElementById(
                        "loginEmail"
                    )
                    .value
                    .trim()
                    .toLowerCase();


            const password =
                document
                    .getElementById(
                        "loginPassword"
                    )
                    .value;


            const users =
                JSON.parse(
                    localStorage.getItem(
                        "studentiq_users"
                    )
                ) || [];


            const user =
                users.find(
                    item =>
                        item.email
                            .toLowerCase() ===
                            email &&
                        item.password ===
                            password
                );


            const error =
                document.getElementById(
                    "loginError"
                );


            if (!user) {

                error.textContent =
                    "Invalid email or password.";

                error.classList.remove(
                    "d-none"
                );

                return;

            }


            localStorage.setItem(
                "studentiq_current_user",
                JSON.stringify(user)
            );


            window.location.href =
                "dashboard.html";

        }
    );

}


/* ------------------------------------------
   REGISTER
------------------------------------------ */

const registerForm =
    document.getElementById(
        "registerForm"
    );


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const name =
                document
                    .getElementById(
                        "registerName"
                    )
                    .value
                    .trim();


            const email =
                document
                    .getElementById(
                        "registerEmail"
                    )
                    .value
                    .trim()
                    .toLowerCase();


            const password =
                document
                    .getElementById(
                        "registerPassword"
                    )
                    .value;


            const error =
                document.getElementById(
                    "registerError"
                );


            if (password.length < 6) {

                error.textContent =
                    "Password must contain at least 6 characters.";

                error.classList.remove(
                    "d-none"
                );

                return;

            }


            const users =
                JSON.parse(
                    localStorage.getItem(
                        "studentiq_users"
                    )
                ) || [];


            if (
                users.some(
                    user =>
                        user.email ===
                        email
                )
            ) {

                error.textContent =
                    "An account with this email already exists.";

                error.classList.remove(
                    "d-none"
                );

                return;

            }


            const newUser = {

                name,

                email,

                password,

                role:
                    "Faculty"

            };


            users.push(
                newUser
            );


            localStorage.setItem(
                "studentiq_users",
                JSON.stringify(users)
            );


            localStorage.setItem(
                "studentiq_current_user",
                JSON.stringify(newUser)
            );


            window.location.href =
                "dashboard.html";

        }
    );

}


/* ------------------------------------------
   UI
------------------------------------------ */

function showRegister() {

    document
        .getElementById(
            "loginBox"
        )
        .classList.add(
            "d-none"
        );


    document
        .getElementById(
            "registerBox"
        )
        .classList.remove(
            "d-none"
        );

}


function showLogin() {

    document
        .getElementById(
            "registerBox"
        )
        .classList.add(
            "d-none"
        );


    document
        .getElementById(
            "loginBox"
        )
        .classList.remove(
            "d-none"
        );

}


function togglePassword(
    id,
    button
) {

    const input =
        document.getElementById(
            id
        );


    if (
        input.type ===
        "password"
    ) {

        input.type =
            "text";

        button.innerHTML =
            `<i class="bi bi-eye-slash"></i>`;

    } else {

        input.type =
            "password";

        button.innerHTML =
            `<i class="bi bi-eye"></i>`;

    }

}