// When navigating to MedicalHistoryPage from another component
import { useNavigate } from 'react-router-dom';
import { usePatientStore } from '../stores/usePatientStore';

const SomeComponent = () => {
  const navigate = useNavigate();
  const setPatientContext = usePatientStore(state => state.setPatientContext);

  const handleNavigate = () => {
    // Set the context first
    setPatientContext({
      patientId: 123,
      visitId: 456,
      medicalHistoryId: 789,
      patientName: "John Doe"
    });
    
    // Then navigate
    navigate('/medical-history');
  };

  return <button onClick={handleNavigate}>Go to Medical History</button>;
};
export default SomeComponent;