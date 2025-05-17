import {
  Dot,
  DotsContainer,
  LoadingComponentContainer,
} from "./LoadingComponentStyles";

interface LoadingComponentProps {
  loadingType: string;
}

const LoadingComponent = ({ loadingType = "dots" }: LoadingComponentProps) => {
  const dotsArray = ["", "", ""];

  return (
    <LoadingComponentContainer>
      {loadingType === "dots" ? (
        <DotsContainer>
          {dotsArray.map((dots, index) => (
            <Dot key={index} delay={index}>
              {dots}
            </Dot>
          ))}
        </DotsContainer>
      ) : (
        <>yo</>
      )}
    </LoadingComponentContainer>
  );
};

export default LoadingComponent;
