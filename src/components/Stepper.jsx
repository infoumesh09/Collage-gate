import React from 'react'
import {
  Box,
  Stepper as MuiStepper,
  Step,
  StepLabel,
  StepContent,
  Paper
} from '@mui/material'

const Stepper = ({ activeStep, steps, children, orientation = 'horizontal' }) => {
  return (
    <Box
      sx={{
        width: '100%',
        color: '#e2e8f0'
      }}
    >
      <MuiStepper
        activeStep={activeStep}
        orientation={orientation}
        sx={{
          mb: 3,
          '& .MuiStepLabel-label': {
            color: 'rgba(148, 163, 184, 0.9)',
            fontSize: '0.7rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase'
          },
          '& .MuiStepIcon-root': {
            color: 'rgba(30, 64, 175, 0.4)'
          },
          '& .Mui-active .MuiStepIcon-root': {
            color: '#22d3ee'
          },
          '& .Mui-completed .MuiStepIcon-root': {
            color: '#4ade80'
          },
          '& .MuiStepConnector-line': {
            borderColor: 'rgba(148, 163, 184, 0.4)'
          }
        }}
      >
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
            {orientation === 'vertical' && (
              <StepContent>
                {index === activeStep && children}
              </StepContent>
            )}
          </Step>
        ))}
      </MuiStepper>
      
      {orientation === 'horizontal' && (
        <Paper
          sx={{
            mt: 4,
            p: { xs: 3, md: 4 },
            borderRadius: '2rem',
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(148, 163, 184, 0.4)',
            backdropFilter: 'blur(28px)',
            boxShadow: '0 40px 80px rgba(15, 23, 42, 0.9)'
          }}
        >
          {children}
        </Paper>
      )}
    </Box>
  )
}

export default Stepper
