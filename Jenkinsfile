
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo 'Jenkins is connected to GitHub.'
                checkout scm
            }
        }

        stage('Check Docker') {
            steps {
                sh 'docker --version'
                sh 'docker-compose --version'
            }
        }

        stage('Validate Docker Compose') {
            steps {
                dir('.') {
                    sh 'docker-compose config -q'
                }
            }
        }

        stage('Build Project Images') {
            steps {
                sh 'docker-compose build'
            }
        }
    }

    post {
        success {
            echo 'SUCCESS: GitHub checkout and Docker image build completed.'
        }
        failure {
            echo 'BUILD FAILED: Open the Jenkins Console Output to inspect the error.'
        }
    }
}
