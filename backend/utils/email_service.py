from decouple import config
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime


class EmailService:
    """Email service for sending emails via Gmail SMTP"""

    def __init__(self):
        self.email_host = config("EMAIL_HOST")
        self.email_port = config("EMAIL_PORT", cast=int)
        self.email_user = config("EMAIL_HOST_USER")
        self.email_password = config("EMAIL_HOST_PASSWORD")
        self.from_email = config("DEFAULT_FROM_EMAIL")

    def send_email(self, to_email: str, subject: str, html_body: str):
        """Send HTML email"""
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.from_email
            message["To"] = to_email

            # Attach HTML body
            html_part = MIMEText(html_body, "html")
            message.attach(html_part)

            # Send email
            with smtplib.SMTP(self.email_host, self.email_port) as server:
                server.starttls()  # Enable TLS
                server.login(self.email_user, self.email_password)
                server.send_message(message)

            print(f"✅ Email sent successfully to {to_email}")
            return True

        except Exception as e:
            print(f"❌ Error sending email: {str(e)}")
            return False

    def send_welcome_email(self, to_email: str, username: str):
        """Send beautiful welcome email to new users"""

        subject = f"🎉 Welcome to GenAI RAG Chatbot, {username}!"

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: 'Arial', sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }}
                .container {{
                    max-width: 600px;
                    margin: 40px auto;
                    background-color: #ffffff;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 40px 20px;
                    text-align: center;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 32px;
                }}
                .content {{
                    padding: 40px 30px;
                    color: #333;
                }}
                .content h2 {{
                    color: #667eea;
                    font-size: 24px;
                    margin-bottom: 20px;
                }}
                .content p {{
                    font-size: 16px;
                    line-height: 1.6;
                    margin-bottom: 15px;
                }}
                .features {{
                    background-color: #f8f9fa;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                }}
                .features ul {{
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }}
                .features li {{
                    padding: 10px 0;
                    border-bottom: 1px solid #e0e0e0;
                }}
                .features li:last-child {{
                    border-bottom: none;
                }}
                .features li:before {{
                    content: "✅ ";
                    color: #667eea;
                    font-weight: bold;
                }}
                .cta-button {{
                    display: inline-block;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 15px 40px;
                    text-decoration: none;
                    border-radius: 25px;
                    font-weight: bold;
                    margin: 20px 0;
                }}
                .footer {{
                    background-color: #f8f9fa;
                    text-align: center;
                    padding: 20px;
                    font-size: 14px;
                    color: #666;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🤖 GenAI RAG Chatbot</h1>
                    <p style="margin: 10px 0 0 0; font-size: 18px;">Your AI-Powered Knowledge Assistant</p>
                </div>

                <div class="content">
                    <h2>Welcome aboard, {username}! 🎉</h2>

                    <p>We're thrilled to have you join our community of AI enthusiasts! Your account has been successfully created, and you're now ready to explore the power of intelligent conversations.</p>

                    <div class="features">
                        <h3 style="margin-top: 0; color: #667eea;">What you can do:</h3>
                        <ul>
                            <li>Chat with our advanced AI chatbot powered by RAG technology</li>
                            <li>Get accurate answers from your uploaded documents</li>
                            <li>Save and review your chat history</li>
                            <li>Update your profile and customize your experience</li>
                        </ul>
                    </div>

                    <p style="text-align: center;">
                        <a href="{config('FRONTEND_URL', default='http://localhost:3000')}" class="cta-button">Start Chatting Now →</a>
                    </p>

                    <p style="font-size: 14px; color: #666; margin-top: 30px;">
                        <strong>Pro tip:</strong> Upload your documents to get personalized, context-aware responses from our AI!
                    </p>
                </div>

                <div class="footer">
                    <p>GenAI RAG Chatbot © {datetime.now().year}</p>
                    <p>Need help? Reply to this email or visit our <a href="#">Help Center</a></p>
                </div>
            </div>
        </body>
        </html>
        """

        return self.send_email(to_email, subject, html_body)


# Create singleton instance
email_service = EmailService()
