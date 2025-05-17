import styled, { css, keyframes } from "styled-components";

export const LoadingComponentContainer = styled.div``;
export const DotsContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const dotsAnimation = keyframes`
0% {
transform: translateY(0);
}
50%{
transform: translateY(-50%);

}
100%{
transform: translateY(0);

}

`;

export const Dot = styled.div<{ delay: number }>`
  width: 20px;
  height: 20px;
  border-radius: 100%;
  background: limegreen;
  position: relative;
  ${({ delay }) => css`
    animation: ${dotsAnimation} 1s ${delay * 0.2}s infinite ease-in-out both;
  `}
`;
