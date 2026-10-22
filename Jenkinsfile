
pipeline {
    agent any

    stages {
        stage('Checkout Code') {
            steps {
                echo 'ExamNexus pipeline has started.'
                echo 'Jenkins has loaded this pipeline from the repository.'
            }
        }

        stage('Check Project Files') {
            steps {
                sh 'pwd'
                sh 'ls -la'
                sh 'test -f docker-compose.yml'
                echo 'Docker Compose file found!'
            }
        }

        stage('Build Information') {
            steps {
                echo 'Project files checked successfully.'
                echo 'Next step: configure Docker access for Jenkins.'
            }
        }
    }

    post {
        success {
            echo 'ExamNexus pipeline completed successfully!'
        }

        failure {
            echo 'Pipeline failed. Check Console Output for details.'
        }
    }
}
